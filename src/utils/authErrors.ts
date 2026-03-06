export type AuthErrorContext = "sign_in" | "sign_up" | "reset";
import { AuthError } from "@supabase/supabase-js";

export function mapAuthError(err: unknown, context: AuthErrorContext): string {
	const raw = String((err as AuthError)?.message || "").toLowerCase();

	if (!raw && context === "reset") return "We couldn't send the reset email. Please try again.";
	if (raw.includes("captcha")) return "Verification failed. Please try again.";
	if (raw.includes("invalid login credentials")) return "Email or password is incorrect.";
	if (raw.includes("email not confirmed") || raw.includes("confirm your email")) {
		return "Please confirm your email before logging in.";
	}
	if (raw.includes("user already registered")) {
		return "If this email can be used, please follow the next steps shown on screen.";
	}
	if (raw.includes("rate limit") || raw.includes("too many")) {
		return "Too many attempts. Please wait a minute and try again.";
	}
	if (raw.includes("password should be at least") || raw.includes("weak password")) {
		return "Your password is too weak. Please use at least 8 characters.";
	}

	switch (context) {
		case "sign_in":
			return "Unable to sign in. Please try again.";
		case "sign_up":
			return "Unable to complete sign up. Please try again.";
		case "reset":
			return "Unable to process password reset. Please try again.";
		default:
			return "Something went wrong. Please try again.";
	}
}
