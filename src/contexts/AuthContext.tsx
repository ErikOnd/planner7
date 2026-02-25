"use client";

import { checkUserExists } from "../app/actions/profile";
import { createClient } from "@utils/supabase/client";
import { createContext, ReactNode, useContext, useMemo } from "react";

type AuthResult = {
	success: boolean;
	error?: string;
	userNeedsConfirmation?: boolean;
};

type AuthContextValue = {
	logInWithPassword: (email: string, password: string) => Promise<AuthResult>;
	signUpWithPassword: (email: string, password: string, displayName: string) => Promise<AuthResult>;
	sendResetPasswordEmail: (email: string) => Promise<AuthResult>;
	signInWithGoogle: () => Promise<AuthResult>;
	signOut: () => Promise<AuthResult>;
	updatePassword: (password: string) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const supabase = useMemo(() => createClient(), []);

	const value = useMemo<AuthContextValue>(() => ({
		logInWithPassword: async (email, password) => {
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) return { success: false, error: error.message };
			await checkUserExists();
			return { success: true };
		},
		signUpWithPassword: async (email, password, displayName) => {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: typeof window !== "undefined" ? `${location.origin}/auth/callback` : undefined,
					data: { displayName },
				},
			});

			if (error) return { success: false, error: error.message };

			if (data?.user && !data?.session && data.user.identities && data.user.identities.length === 0) {
				return { success: false, error: "An account with this email already exists. Please log in instead." };
			}

			if (!data?.session) {
				return { success: true, userNeedsConfirmation: true };
			}

			await checkUserExists();
			return { success: true };
		},
		sendResetPasswordEmail: async (email) => {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: typeof window !== "undefined"
					? `${location.origin}/auth/callback?type=recovery`
					: undefined,
			});
			if (error) return { success: false, error: error.message };
			return { success: true };
		},
		signInWithGoogle: async () => {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: typeof window !== "undefined"
						? `${location.origin}/auth/callback`
						: undefined,
				},
			});
			if (error) return { success: false, error: error.message };
			return { success: true };
		},
		signOut: async () => {
			const { error } = await supabase.auth.signOut();
			if (error) return { success: false, error: error.message };
			return { success: true };
		},
		updatePassword: async (password) => {
			const { error } = await supabase.auth.updateUser({ password });
			if (error) return { success: false, error: error.message };
			return { success: true };
		},
	}), [supabase]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
