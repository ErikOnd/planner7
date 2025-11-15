"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@utils/supabase/server";

/**
 * Ensures a Profile record exists for the authenticated user.
 * Call this after successful login/signup.
 */
export async function ensureProfileExists() {
	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError || !user) {
			return { success: false, error: "Not authenticated" };
		}

		await prisma.profile.upsert({
			where: { id: user.id },
			update: {
				email: user.email ?? "",
			},
			create: {
				id: user.id,
				email: user.email ?? "",
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error ensuring profile exists:", error);
		return { success: false, error: "Failed to create profile" };
	}
}
