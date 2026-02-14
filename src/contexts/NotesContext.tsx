"use client";

import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import type { NoteContent } from "types/noteContent";
import { cleanupUnusedImages } from "../actions/upload-image";
import { getDailyNote, getWeeklyNotes, saveDailyNote } from "../app/actions/dailyNotes";

type NoteCache = {
	[dateString: string]: NoteContent | undefined;
};

type LoadingState = {
	[dateString: string]: boolean;
};

type NotesContextType = {
	getNote: (dateString: string) => NoteContent | undefined;
	hasNote: (dateString: string) => boolean;
	isLoading: (dateString: string) => boolean;
	loadWeek: (startDate: Date, endDate: Date) => Promise<void>;
	saveNote: (dateString: string, content: NoteContent) => Promise<void>;
	isWeekLoading: boolean;
};

const NotesContext = createContext<NotesContextType | undefined>(undefined);
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const LAST_CLEANUP_KEY = "planner7:last-image-cleanup-at";

export function NotesProvider({ children }: { children: ReactNode }) {
	const cacheRef = useRef<NoteCache>({});
	const [loadingStates, setLoadingStates] = useState<LoadingState>({});
	const [isWeekLoading, setIsWeekLoading] = useState(false);
	const [, forceUpdate] = useState({});
	const isCleanupRunningRef = useRef(false);

	const triggerUpdate = useCallback(() => {
		forceUpdate({});
	}, []);

	const getNote = useCallback((dateString: string): NoteContent | undefined => {
		return cacheRef.current[dateString];
	}, []);

	const hasNote = useCallback((dateString: string): boolean => {
		return dateString in cacheRef.current;
	}, []);

	const isLoading = useCallback((dateString: string): boolean => {
		return loadingStates[dateString] || false;
	}, [loadingStates]);

	const loadWeek = useCallback(async (startDate: Date, endDate: Date) => {
		setIsWeekLoading(true);

		try {
			// Calculate all dates in the week
			const weekDates: string[] = [];
			const current = new Date(startDate);
			while (current <= endDate) {
				weekDates.push(current.toISOString().split("T")[0]);
				current.setDate(current.getDate() + 1);
			}

			// Batch fetch all notes for the week
			const notes = await getWeeklyNotes(startDate, endDate);

			// Build content map from persisted rows first.
			const noteMap: Record<string, NoteContent | undefined> = {};
			notes.forEach(note => {
				const dateString = note.date.toISOString().split("T")[0];
				noteMap[dateString] = note.content as NoteContent | undefined;
			});

			// Mark every day as loaded after fetch completes to avoid mounting editors with stale empty state.
			weekDates.forEach(dateString => {
				cacheRef.current[dateString] = noteMap[dateString];
			});

			triggerUpdate();

			if (!isCleanupRunningRef.current && typeof window !== "undefined") {
				const lastCleanupAt = Number(window.localStorage.getItem(LAST_CLEANUP_KEY) || 0);
				if (!Number.isFinite(lastCleanupAt) || Date.now() - lastCleanupAt >= CLEANUP_INTERVAL_MS) {
					isCleanupRunningRef.current = true;
					void cleanupUnusedImages()
						.then((result) => {
							if (!result.success) {
								console.error("Image cleanup failed:", result.error);
								return;
							}
							window.localStorage.setItem(LAST_CLEANUP_KEY, String(Date.now()));
						})
						.catch((error) => {
							console.error("Image cleanup action crashed:", error);
						})
						.finally(() => {
							isCleanupRunningRef.current = false;
						});
				}
			}
		} catch (error) {
			console.error("Error loading weekly notes:", error);
		} finally {
			setIsWeekLoading(false);
		}
	}, [triggerUpdate]);

	const saveNote = useCallback(async (dateString: string, content: NoteContent) => {
		// Optimistic update
		cacheRef.current[dateString] = content;
		triggerUpdate();

		// Mark as loading
		setLoadingStates(prev => ({ ...prev, [dateString]: true }));

		try {
			const result = await saveDailyNote(dateString, content);
			if (!result.success) {
				throw new Error(result.error ?? "Failed to save note");
			}
		} catch (error) {
			console.error("Error saving note:", error);
			// Rollback on error by refetching
			try {
				const note = await getDailyNote(dateString);
				cacheRef.current[dateString] = note?.content as NoteContent | undefined;
				triggerUpdate();
			} catch (fetchError) {
				console.error("Error fetching note after save failure:", fetchError);
			}
		} finally {
			setLoadingStates(prev => ({ ...prev, [dateString]: false }));
		}
	}, [triggerUpdate]);

	return (
		<NotesContext.Provider
			value={{
				getNote,
				hasNote,
				isLoading,
				loadWeek,
				saveNote,
				isWeekLoading,
			}}
		>
			{children}
		</NotesContext.Provider>
	);
}

export function useNotes() {
	const context = useContext(NotesContext);
	if (context === undefined) {
		throw new Error("useNotes must be used within a NotesProvider");
	}
	return context;
}
