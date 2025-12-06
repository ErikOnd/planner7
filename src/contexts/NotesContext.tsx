"use client";

import type { Block } from "@blocknote/core";
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { getDailyNote, getWeeklyNotes, saveDailyNote } from "../app/actions/dailyNotes";

type NoteCache = {
	[dateString: string]: Block[] | undefined;
};

type LoadingState = {
	[dateString: string]: boolean;
};

type NotesContextType = {
	getNote: (dateString: string) => Block[] | undefined;
	hasNote: (dateString: string) => boolean;
	isLoading: (dateString: string) => boolean;
	loadWeek: (startDate: Date, endDate: Date) => Promise<void>;
	saveNote: (dateString: string, content: Block[]) => Promise<void>;
	isWeekLoading: boolean;
};

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
	const cacheRef = useRef<NoteCache>({});
	const [loadingStates, setLoadingStates] = useState<LoadingState>({});
	const [isWeekLoading, setIsWeekLoading] = useState(false);
	const [, forceUpdate] = useState({});

	const triggerUpdate = useCallback(() => {
		forceUpdate({});
	}, []);

	const getNote = useCallback((dateString: string): Block[] | undefined => {
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

			// Pre-populate cache with undefined for all dates to prevent individual fetches
			weekDates.forEach(dateString => {
				cacheRef.current[dateString] = undefined;
			});
			triggerUpdate();

			// Batch fetch all notes for the week
			const notes = await getWeeklyNotes(startDate, endDate);

			// Update cache with actual content
			notes.forEach(note => {
				const dateString = note.date.toISOString().split("T")[0];
				cacheRef.current[dateString] = note.content as Block[] | undefined;
			});

			triggerUpdate();
		} catch (error) {
			console.error("Error loading weekly notes:", error);
		} finally {
			setIsWeekLoading(false);
		}
	}, [triggerUpdate]);

	const saveNote = useCallback(async (dateString: string, content: Block[]) => {
		// Optimistic update
		cacheRef.current[dateString] = content;
		triggerUpdate();

		// Mark as loading
		setLoadingStates(prev => ({ ...prev, [dateString]: true }));

		try {
			await saveDailyNote(dateString, content);
		} catch (error) {
			console.error("Error saving note:", error);
			// Rollback on error by refetching
			try {
				const note = await getDailyNote(dateString);
				cacheRef.current[dateString] = note?.content as Block[] | undefined;
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
