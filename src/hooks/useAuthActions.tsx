"use client";

import { mapAuthError } from "@utils/authErrors";
import { createClient } from "@utils/supabase/client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { checkUserExists } from "../app/actions/profile";

export function useAuthActions() {
	const router = useRouter();
	const supabase = createClient();

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
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				setErrorMsg(mapAuthError(error, "sign_in"));
				return;
			}
			await checkUserExists();
			router.push("/");
		} catch (err) {
			setErrorMsg(mapAuthError(err, "sign_in"));
		} finally {
			setLoading(false);
		}
	}, [clearMessages, router, supabase]);

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
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: typeof window !== "undefined" ? `${location.origin}/auth/callback` : undefined,
					data: {
						displayName: displayName,
					},
				},
			});
			if (error) {
				setErrorMsg(mapAuthError(error, "sign_up"));
				return;
			}
			if (data?.user && !data?.session && data.user.identities && data.user.identities.length === 0) {
				setErrorMsg("An account with this email already exists. Please log in instead.");
				return;
			}
			if (!data?.session) {
				setInfoMsg("Success! Please check your email to confirm your account.");
				return;
			}
			await checkUserExists();
			router.push("/");
		} catch (err) {
			setErrorMsg(mapAuthError(err, "sign_up"));
		} finally {
			setLoading(false);
		}
	}, [clearMessages, router, supabase]);

	const sendResetPassword = useCallback(async (email: string) => {
		clearMessages();
		if (!email) {
			setErrorMsg("Enter your email first to receive a reset link.");
			return;
		}
		setLoading(true);
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: typeof window !== "undefined"
					? `${location.origin}/auth/callback?type=recovery`
					: undefined,
			});
			if (error) {
				setErrorMsg(mapAuthError(error, "reset"));
				return;
			}
			setInfoMsg("Password reset email sent. Please check your inbox.");
		} catch (err) {
			setErrorMsg(mapAuthError(err, "reset"));
		} finally {
			setLoading(false);
		}
	}, [clearMessages, supabase]);

	return { loading, errorMsg, infoMsg, setErrorMsg, setInfoMsg, logIn, signUp, sendResetPassword };
}
