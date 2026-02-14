"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { getUserPreferences, updateUserPreferences } from "../app/actions/profile";

type WeekDisplayContextValue = {
	showWeekends: boolean;
	showEditorToolbar: boolean;
	isLoading: boolean;
	isSaving: boolean;
	error: string | null;
	setShowWeekends: (value: boolean) => Promise<void>;
	setShowEditorToolbar: (value: boolean) => Promise<void>;
};

const WeekDisplayContext = createContext<WeekDisplayContextValue | undefined>(undefined);

export function WeekDisplayProvider({ children }: { children: ReactNode }) {
	const [showWeekends, setShowWeekendsState] = useState(true);
	const [showEditorToolbar, setShowEditorToolbarState] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPreferences = async () => {
			setIsLoading(true);
			const result = await getUserPreferences();
			if (result.success && result.data) {
				setShowWeekendsState(result.data.showWeekends);
				setShowEditorToolbarState(Boolean(result.data.showEditorToolbar));
			} else {
				setError(result.error || "Failed to load preferences");
			}
			setIsLoading(false);
		};

		fetchPreferences();
	}, []);

	const setShowWeekends = async (value: boolean) => {
		setShowWeekendsState(value);
		setIsSaving(true);
		setError(null);

		const result = await updateUserPreferences({ showWeekends: value });
		if (!result.success) {
			setError(result.error || "Failed to update preferences");
			setShowWeekendsState(prev => !prev);
		}

		setIsSaving(false);
	};

	const setShowEditorToolbar = async (value: boolean) => {
		setShowEditorToolbarState(value);
		setIsSaving(true);
		setError(null);

		const result = await updateUserPreferences({ showEditorToolbar: value });
		if (!result.success) {
			setError(result.error || "Failed to update preferences");
			setShowEditorToolbarState(prev => !prev);
		}

		setIsSaving(false);
	};

	return (
		<WeekDisplayContext.Provider
			value={{
				showWeekends,
				showEditorToolbar,
				isLoading,
				isSaving,
				error,
				setShowWeekends,
				setShowEditorToolbar,
			}}
		>
			{children}
		</WeekDisplayContext.Provider>
	);
}

export function useWeekDisplay() {
	const context = useContext(WeekDisplayContext);
	if (!context) {
		throw new Error("useWeekDisplay must be used within a WeekDisplayProvider");
	}
	return context;
}
