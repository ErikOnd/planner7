import { createClient } from "@utils/supabase/server";
import { NextResponse } from "next/server";
import { createNewUser, syncEmailFromAuth } from "../../actions/profile";

function sanitizeNextPath(nextParam: string | null): string {
	if (!nextParam) return "/app";
	if (!nextParam.startsWith("/")) return "/app";
	if (nextParam.startsWith("//")) return "/app";
	return nextParam;
}

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const next = sanitizeNextPath(searchParams.get("next"));
	const type = searchParams.get("type");

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			if (type === "recovery") {
				return NextResponse.redirect(`${origin}/auth/reset-password`);
			}

			// Try to create new user (will fail silently if already exists)
			await createNewUser();

			// Sync email from Auth to Profile (handles email confirmation)
			await syncEmailFromAuth();

			const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
			const baseUrl = siteUrl && /^https?:\/\//i.test(siteUrl) ? siteUrl : origin;
			return NextResponse.redirect(new URL(next, baseUrl));
		}
	}

	return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
