import { createClient } from "@utils/supabase/server";
import { NextResponse } from "next/server";
import { createNewUser, syncEmailFromAuth } from "../../actions/profile";

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const next = searchParams.get("next") ?? "/";
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

			const forwardedHost = request.headers.get("x-forwarded-host");
			const isLocalEnv = process.env.NODE_ENV === "development";

			if (isLocalEnv) {
				return NextResponse.redirect(`${origin}${next}`);
			} else if (forwardedHost) {
				return NextResponse.redirect(`https://${forwardedHost}${next}`);
			} else {
				return NextResponse.redirect(`${origin}${next}`);
			}
		}
	}

	return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
