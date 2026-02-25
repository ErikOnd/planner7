"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "../app/actions/profile";

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
	const [displayName, setDisplayName] = useState<string | null>(null);
	const [isResolved, setIsResolved] = useState(false);

	useEffect(() => {
		let mounted = true;
		const loadProfile = async () => {
			try {
				const result = await getUserProfile();
				if (!mounted) return;
				if (!result.success || !result.data) {
					setDisplayName(readStoredDisplayName() ?? fallback);
					return;
				}

				const profileName = result.data.displayName?.trim() ?? "";
				if (profileName) {
					setDisplayName(profileName);
					writeStoredDisplayName(profileName);
					return;
				}

				setDisplayName(readStoredDisplayName() ?? fallback);
			} finally {
				if (mounted) {
					setIsResolved(true);
				}
			}
		};
		void loadProfile();
		return () => {
			mounted = false;
		};
	}, [fallback]);

	useEffect(() => {
		const onDisplayNameUpdated = (event: Event) => {
			const customEvent = event as CustomEvent<{ displayName?: string }>;
			const nextName = customEvent.detail?.displayName?.trim();
			if (nextName) {
				setDisplayName(nextName);
				writeStoredDisplayName(nextName);
				setIsResolved(true);
			}
		};

		window.addEventListener("profile:display-name-updated", onDisplayNameUpdated as EventListener);
		return () => {
			window.removeEventListener("profile:display-name-updated", onDisplayNameUpdated as EventListener);
		};
	}, []);

	return {
		displayName,
		isResolved,
	};
}
