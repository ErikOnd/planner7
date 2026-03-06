"use client";

import { type AuthResult, useAuth } from "@/contexts/AuthContext";
import { getAuthCaptchaToken } from "@/lib/authCaptcha";
import { type AuthErrorContext, mapAuthError } from "@utils/authErrors";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type CaptchaAction = Parameters<typeof getAuthCaptchaToken>[0];

type RunAuthActionParams = {
	context: AuthErrorContext;
	captchaAction: CaptchaAction;
	fallbackError: string;
	execute: (captchaToken?: string) => Promise<AuthResult>;
	onSuccess?: (result: AuthResult) => Promise<void> | void;
};

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

	const setValidationError = useCallback((message: string) => {
		clearMessages();
		setErrorMsg(message);
	}, [clearMessages]);

	const runAuthAction = useCallback(async ({
		context,
		captchaAction,
		fallbackError,
		execute,
		onSuccess,
	}: RunAuthActionParams) => {
		clearMessages();
		setLoading(true);
		try {
			const captchaToken = await getAuthCaptchaToken(captchaAction);
			const result = await execute(captchaToken);
			if (!result.success) {
				setErrorMsg(mapAuthError(result.error ?? fallbackError, context));
				return;
			}
			await onSuccess?.(result);
		} catch (err) {
			setErrorMsg(mapAuthError(err, context));
		} finally {
			setLoading(false);
		}
	}, [clearMessages]);

	const logIn = useCallback(async (email: string, password: string) => {
		if (!email || !password) {
			setValidationError("Please enter both email and password.");
			return;
		}
		await runAuthAction({
			context: "sign_in",
			captchaAction: "login",
			fallbackError: "Failed to sign in",
			execute: (captchaToken) => auth.logInWithPassword(email, password, captchaToken),
			onSuccess: () => router.push("/app"),
		});
	}, [auth, router, runAuthAction, setValidationError]);

	const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
		if (!email || !password) {
			setValidationError("Please enter both email and password.");
			return;
		}
		if (!displayName) {
			setValidationError("Please enter your name.");
			return;
		}
		if (password.length < 8) {
			setValidationError("Password must be at least 8 characters.");
			return;
		}
		await runAuthAction({
			context: "sign_up",
			captchaAction: "signup",
			fallbackError: "Failed to sign up",
			execute: (captchaToken) => auth.signUpWithPassword(email, password, displayName, captchaToken),
			onSuccess: (result) => {
				if (result.userNeedsConfirmation) {
					setInfoMsg("If this email can sign up, check your inbox for next steps.");
					return;
				}
				router.push("/app");
			},
		});
	}, [auth, router, runAuthAction, setValidationError]);

	const sendResetPassword = useCallback(async (email: string) => {
		if (!email) {
			setValidationError("Enter your email first to receive a reset link.");
			return;
		}
		await runAuthAction({
			context: "reset",
			captchaAction: "recover",
			fallbackError: "Failed to send reset email",
			execute: (captchaToken) => auth.sendResetPasswordEmail(email, captchaToken),
			onSuccess: () => {
				setInfoMsg("Password reset email sent. Please check your inbox.");
			},
		});
	}, [auth, runAuthAction, setValidationError]);

	const signInWithGoogleIdToken = useCallback(async (idToken: string) => {
		await runAuthAction({
			context: "sign_in",
			captchaAction: "google",
			fallbackError: "Failed to sign in with Google",
			execute: (captchaToken) => auth.signInWithGoogleIdToken(idToken, captchaToken),
			onSuccess: () => router.push("/app"),
		});
	}, [auth, router, runAuthAction]);

	return {
		loading,
		errorMsg,
		infoMsg,
		setErrorMsg,
		setInfoMsg,
		logIn,
		signUp,
		sendResetPassword,
		signInWithGoogleIdToken,
	};
}
