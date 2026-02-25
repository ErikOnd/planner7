"use client";

import { useProfile } from "@/contexts/ProfileContext";
import { useEffect, useState } from "react";

const DISPLAY_NAME_STORAGE_KEY = "planner7:display-name";

function readStoredDisplayName() {
	if (typeof window === "undefined") return null;
	try {
		const stored = window.localStorage.getItem(DISPLAY_NAME_STORAGE_KEY);
		return stored?.trim() || null;
	} catch {
		return null;
	}
}

function writeStoredDisplayName(value: string) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, value);
	} catch {
		// Ignore storage errors (private mode, denied access, etc.)
	}
}

export function useDisplayName(fallback = "Planner") {
	const { profile, isLoading } = useProfile();
	const [displayName, setDisplayName] = useState<string | null>(null);
	const isResolved = !isLoading;

	useEffect(() => {
		if (isLoading) return;
		const profileName = profile?.displayName?.trim() ?? "";
		if (profileName) {
			setDisplayName(profileName);
			writeStoredDisplayName(profileName);
			return;
		}
		setDisplayName(readStoredDisplayName() ?? fallback);
	}, [fallback, isLoading, profile]);

	return {
		displayName,
		isResolved,
	};
}
