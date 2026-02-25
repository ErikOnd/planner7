"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { NoteContent } from "types/noteContent";
import { cleanupUnusedImages } from "../actions/upload-image";
import { getDailyNote, getWeeklyNotes, saveDailyNote } from "../app/actions/dailyNotes";
import { useWorkspace } from "./WorkspaceContext";

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
const WEEK_CACHE_TTL_MS = 60 * 1000;
const NOTES_CACHE_STORAGE_KEY = "planner7:notes-cache:v1";
const WEEK_LOADED_AT_STORAGE_KEY = "planner7:notes-week-loaded-at:v1";
const PERSIST_TTL_MS = 12 * 60 * 60 * 1000;

function toDateString(date: Date) {
	return date.toISOString().split("T")[0];
}

function toNoteKey(workspaceId: string, dateString: string) {
	return `${workspaceId}:${dateString}`;
}

function toWeekKey(workspaceId: string, startDate: Date, endDate: Date) {
	return `${workspaceId}:${toDateString(startDate)}:${toDateString(endDate)}`;
}

type WeeklyNoteApiResponse = {
	success: boolean;
	error?: string;
	notes?: Array<{ date: string; content: NoteContent | undefined }>;
};

function readJsonFromSessionStorage<T>(key: string): T | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.sessionStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

function writeJsonToSessionStorage<T>(key: string, value: T) {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Ignore storage write failures.
	}
}

async function fetchWeeklyNotesFromApi(startDate: Date, endDate: Date) {
	const params = new URLSearchParams({
		start: toDateString(startDate),
		end: toDateString(endDate),
	});
	const response = await fetch(`/api/notes/week?${params.toString()}`, {
		method: "GET",
		credentials: "same-origin",
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(`Weekly notes API failed with status ${response.status}`);
	}

	const payload = await response.json() as WeeklyNoteApiResponse;
	if (!payload.success) {
		throw new Error(payload.error ?? "Weekly notes API failed");
	}

	return payload.notes ?? [];
}

export function NotesProvider({ children }: { children: ReactNode }) {
	const { activeWorkspaceId } = useWorkspace();
	const cacheRef = useRef<NoteCache>({});
	const [loadingStates, setLoadingStates] = useState<LoadingState>({});
	const [isWeekLoading, setIsWeekLoading] = useState(false);
	const [, forceUpdate] = useState({});
	const isCleanupRunningRef = useRef(false);
	const inFlightWeekLoadsRef = useRef<Record<string, Promise<void>>>({});
	const weekLoadedAtRef = useRef<Record<string, number>>({});

	const triggerUpdate = useCallback(() => {
		forceUpdate({});
	}, []);

	useEffect(() => {
		const persistedCache = readJsonFromSessionStorage<NoteCache>(NOTES_CACHE_STORAGE_KEY);
		const persistedWeekLoadedAt = readJsonFromSessionStorage<Record<string, number>>(WEEK_LOADED_AT_STORAGE_KEY);
		const now = Date.now();

		if (persistedCache) {
			cacheRef.current = persistedCache;
		}

		if (persistedWeekLoadedAt) {
			weekLoadedAtRef.current = Object.fromEntries(
				Object.entries(persistedWeekLoadedAt).filter(([, loadedAt]) => {
					return Number.isFinite(loadedAt) && now - loadedAt < PERSIST_TTL_MS;
				}),
			);
		}

		triggerUpdate();
	}, [triggerUpdate]);

	useEffect(() => {
		// Reset transient load state when switching workspace to avoid stale loading keys.
		setLoadingStates({});
		setIsWeekLoading(false);
	}, [activeWorkspaceId]);

	const persistCache = useCallback(() => {
		writeJsonToSessionStorage(NOTES_CACHE_STORAGE_KEY, cacheRef.current);
		writeJsonToSessionStorage(WEEK_LOADED_AT_STORAGE_KEY, weekLoadedAtRef.current);
	}, []);

	const getNote = useCallback((dateString: string): NoteContent | undefined => {
		if (!activeWorkspaceId) return undefined;
		return cacheRef.current[toNoteKey(activeWorkspaceId, dateString)];
	}, [activeWorkspaceId]);

	const hasNote = useCallback((dateString: string): boolean => {
		if (!activeWorkspaceId) return false;
		return toNoteKey(activeWorkspaceId, dateString) in cacheRef.current;
	}, [activeWorkspaceId]);

	const isLoading = useCallback((dateString: string): boolean => {
		if (!activeWorkspaceId) return false;
		return loadingStates[toNoteKey(activeWorkspaceId, dateString)] || false;
	}, [activeWorkspaceId, loadingStates]);

	const loadWeek = useCallback(async (startDate: Date, endDate: Date) => {
		if (!activeWorkspaceId) return;
		const weekDates: string[] = [];
		const current = new Date(startDate);
		while (current <= endDate) {
			weekDates.push(toDateString(current));
			current.setDate(current.getDate() + 1);
		}
		const weekKey = toWeekKey(activeWorkspaceId, startDate, endDate);
		const hasCachedWeek = weekDates.every((dateString) => {
			return toNoteKey(activeWorkspaceId, dateString) in cacheRef.current;
		});
		const lastLoadedAt = weekLoadedAtRef.current[weekKey] ?? 0;
		const isFresh = Date.now() - lastLoadedAt < WEEK_CACHE_TTL_MS;

		// Serve cache instantly and skip network for fresh weeks.
		if (hasCachedWeek) {
			triggerUpdate();
			if (isFresh) return;
		} else {
			setIsWeekLoading(true);
		}

		const existingInFlight = inFlightWeekLoadsRef.current[weekKey];
		if (existingInFlight) {
			await existingInFlight;
			return;
		}

		const loadPromise = (async () => {
			try {
				const noteMap: Record<string, NoteContent | undefined> = {};
				try {
					const notes = await fetchWeeklyNotesFromApi(startDate, endDate);
					notes.forEach((note) => {
						noteMap[note.date] = note.content;
					});
				} catch {
					const notes = await getWeeklyNotes(startDate, endDate);
					notes.forEach(note => {
						noteMap[toDateString(note.date)] = note.content as NoteContent | undefined;
					});
				}

				weekDates.forEach((dateString) => {
					cacheRef.current[toNoteKey(activeWorkspaceId, dateString)] = noteMap[dateString];
				});
				weekLoadedAtRef.current[weekKey] = Date.now();
				persistCache();
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
				delete inFlightWeekLoadsRef.current[weekKey];
				if (!hasCachedWeek) {
					setIsWeekLoading(false);
				}
			}
		})();

		inFlightWeekLoadsRef.current[weekKey] = loadPromise;
		await loadPromise;
	}, [activeWorkspaceId, persistCache, triggerUpdate]);

	const saveNote = useCallback(async (dateString: string, content: NoteContent) => {
		if (!activeWorkspaceId) return;
		const noteKey = toNoteKey(activeWorkspaceId, dateString);

		// Optimistic update
		cacheRef.current[noteKey] = content;
		persistCache();
		triggerUpdate();

		// Mark as loading
		setLoadingStates(prev => ({ ...prev, [noteKey]: true }));

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
				cacheRef.current[noteKey] = note?.content as NoteContent | undefined;
				persistCache();
				triggerUpdate();
			} catch (fetchError) {
				console.error("Error fetching note after save failure:", fetchError);
			}
		} finally {
			setLoadingStates(prev => ({ ...prev, [noteKey]: false }));
		}
	}, [activeWorkspaceId, persistCache, triggerUpdate]);

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
