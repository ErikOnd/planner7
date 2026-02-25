"use client";

import { mapAuthError } from "@utils/authErrors";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function useAuthActions() {
	const router = useRouter();
	const auth = useAuth();

	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [infoMsg, setInfoMsg] = useState<string | null>(null);

	const clearMessages = useCallback(() => {
		setErrorMsg(null);
		setInfoMsg(null);
	}, []);

	const logIn = useCallback(async (email: string, password: string) => {
		clearMessages();
		if (!email || !password) {
			setErrorMsg("Please enter both email and password.");
			return;
		}
		setLoading(true);
		try {
			const result = await auth.logInWithPassword(email, password);
			if (!result.success) {
				setErrorMsg(mapAuthError(result.error ?? "Failed to sign in", "sign_in"));
				return;
			}
			router.push("/app");
		} catch (err) {
			setErrorMsg(mapAuthError(err, "sign_in"));
		} finally {
			setLoading(false);
		}
	}, [auth, clearMessages, router]);

	const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
		clearMessages();
		if (!email || !password) {
			setErrorMsg("Please enter both email and password.");
			return;
		}
		if (!displayName) {
			setErrorMsg("Please enter your name.");
			return;
		}
		setLoading(true);
		try {
			const result = await auth.signUpWithPassword(email, password, displayName);
			if (!result.success) {
				setErrorMsg(mapAuthError(result.error ?? "Failed to sign up", "sign_up"));
				return;
			}
			if (result.userNeedsConfirmation) {
				setInfoMsg("Success! Please check your email to confirm your account.");
				return;
			}
			router.push("/app");
		} catch (err) {
			setErrorMsg(mapAuthError(err, "sign_up"));
		} finally {
			setLoading(false);
		}
	}, [auth, clearMessages, router]);

	const sendResetPassword = useCallback(async (email: string) => {
		clearMessages();
		if (!email) {
			setErrorMsg("Enter your email first to receive a reset link.");
			return;
		}
		setLoading(true);
		try {
			const result = await auth.sendResetPasswordEmail(email);
			if (!result.success) {
				setErrorMsg(mapAuthError(result.error ?? "Failed to send reset email", "reset"));
				return;
			}
			setInfoMsg("Password reset email sent. Please check your inbox.");
		} catch (err) {
			setErrorMsg(mapAuthError(err, "reset"));
		} finally {
			setLoading(false);
		}
	}, [auth, clearMessages]);

	const signInWithGoogle = useCallback(async () => {
		clearMessages();
		setLoading(true);
		try {
			const result = await auth.signInWithGoogle();
			if (!result.success) {
				setErrorMsg(mapAuthError(result.error ?? "Failed to sign in with Google", "sign_in"));
				setLoading(false);
			}
		} catch (err) {
			setErrorMsg(mapAuthError(err, "sign_in"));
			setLoading(false);
		}
	}, [auth, clearMessages]);

	return { loading, errorMsg, infoMsg, setErrorMsg, setInfoMsg, logIn, signUp, sendResetPassword, signInWithGoogle };
}
