"use client";

import { createClient } from "@utils/supabase/client";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { checkUserExists } from "../app/actions/profile";

export type AuthResult = {
	success: boolean;
	error?: string;
	userNeedsConfirmation?: boolean;
};

type AuthContextValue = {
	logInWithPassword: (email: string, password: string, captchaToken?: string) => Promise<AuthResult>;
	signUpWithPassword: (
		email: string,
		password: string,
		displayName: string,
		captchaToken?: string,
	) => Promise<AuthResult>;
	sendResetPasswordEmail: (email: string, captchaToken?: string) => Promise<AuthResult>;
	signInWithGoogleIdToken: (idToken: string, nonce?: string, captchaToken?: string) => Promise<AuthResult>;
	signOut: () => Promise<AuthResult>;
	updatePassword: (password: string) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getBrowserRedirectUrl(path: string): string | undefined {
	if (typeof window === "undefined") {
		return undefined;
	}

	return `${window.location.origin}${path}`;
}

function successResult(): AuthResult {
	return { success: true };
}

function errorResult(error: { message: string }): AuthResult {
	return { success: false, error: error.message };
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const supabase = useMemo(() => createClient(), []);

	const value = useMemo<AuthContextValue>(() => {
		const syncUserProfile = async (): Promise<AuthResult> => {
			await checkUserExists();
			return successResult();
		};

		return {
			logInWithPassword: async (email, password, captchaToken) => {
				const { error } = await supabase.auth.signInWithPassword({
					email,
					password,
					options: {
						captchaToken,
					},
				});
				if (error) return errorResult(error);
				return syncUserProfile();
			},
			signUpWithPassword: async (email, password, displayName, captchaToken) => {
				const { data, error } = await supabase.auth.signUp({
					email,
					password,
					options: {
						emailRedirectTo: getBrowserRedirectUrl("/auth/callback"),
						data: { displayName },
						captchaToken,
					},
				});

				if (error) return errorResult(error);

				if (!data?.session) {
					return { ...successResult(), userNeedsConfirmation: true };
				}

				return syncUserProfile();
			},
			sendResetPasswordEmail: async (email, captchaToken) => {
				const { error } = await supabase.auth.resetPasswordForEmail(email, {
					redirectTo: getBrowserRedirectUrl("/auth/callback?type=recovery"),
					captchaToken,
				});
				if (error) return errorResult(error);
				return successResult();
			},
			signInWithGoogleIdToken: async (idToken, nonce, captchaToken) => {
				const { error } = await supabase.auth.signInWithIdToken({
					provider: "google",
					token: idToken,
					nonce,
					options: {
						captchaToken,
					},
				});
				if (error) return errorResult(error);
				return syncUserProfile();
			},
			signOut: async () => {
				const { error } = await supabase.auth.signOut();
				if (error) return errorResult(error);
				return successResult();
			},
			updatePassword: async (password) => {
				const { error } = await supabase.auth.updateUser({ password });
				if (error) return errorResult(error);
				return successResult();
			},
		};
	}, [supabase]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
