"use client";

import type { ProfileData } from "@hooks/useProfileSettings";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getUserProfile, updateUserProfile } from "../app/actions/profile";

type ProfileUpdateInput = {
	displayName?: string;
	email?: string;
};

type ProfileUpdateResult = {
	success: boolean;
	error?: string;
	data?: ProfileData;
	emailConfirmationRequired?: boolean;
};

type ProfileContextValue = {
	profile: ProfileData | null;
	isLoading: boolean;
	error: string | null;
	refreshProfile: () => Promise<ProfileUpdateResult>;
	updateProfile: (input: ProfileUpdateInput) => Promise<ProfileUpdateResult>;
	updateDisplayName: (displayName: string) => Promise<ProfileUpdateResult>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refreshProfile = useCallback(async (): Promise<ProfileUpdateResult> => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await getUserProfile();
			if (!result.success || !result.data) {
				const message = result.error || "Failed to load profile";
				setError(message);
				return { success: false, error: message };
			}

			setProfile(result.data);
			return { success: true, data: result.data };
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void refreshProfile();
	}, [refreshProfile]);

	const updateProfile = useCallback(async (input: ProfileUpdateInput): Promise<ProfileUpdateResult> => {
		setError(null);
		const result = await updateUserProfile(input);
		if (!result.success || !result.data) {
			const message = result.error || "Failed to update profile";
			setError(message);
			return { success: false, error: message };
		}

		setProfile(result.data);
		return {
			success: true,
			data: result.data,
			emailConfirmationRequired: result.emailConfirmationRequired,
		};
	}, []);

	const updateDisplayName = useCallback(async (displayName: string): Promise<ProfileUpdateResult> => {
		return updateProfile({ displayName });
	}, [updateProfile]);

	const value = useMemo<ProfileContextValue>(() => ({
		profile,
		isLoading,
		error,
		refreshProfile,
		updateProfile,
		updateDisplayName,
	}), [profile, isLoading, error, refreshProfile, updateProfile, updateDisplayName]);

	return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
	const context = useContext(ProfileContext);
	if (!context) {
		throw new Error("useProfile must be used within a ProfileProvider");
	}
	return context;
}
