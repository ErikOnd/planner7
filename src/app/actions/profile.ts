"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@utils/supabase/server";

export async function checkUserExists() {
	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError || !user) {
			return { success: false, error: "Not authenticated" };
		}

		const profile = await prisma.profile.findUnique({
			where: { id: user.id },
		});

		if (!profile) {
			return { success: false, error: "Profile not found" };
		}

		return { success: true };
	} catch (error) {
		console.error("Error checking if user exists:", error);
		return { success: false, error: "Failed to check user" };
	}
}

export async function createNewUser(displayName?: string) {
	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError || !user) {
			return { success: false, error: "Not authenticated" };
		}

		// Only create user if email is verified
		if (!user.email_confirmed_at) {
			return { success: false, error: "Email not verified" };
		}

		// Get displayName from parameter or user metadata
		const userDisplayName = displayName || (user.user_metadata?.displayName as string) || null;

		await prisma.profile.create({
			data: {
				id: user.id,
				email: user.email ?? "",
				displayName: userDisplayName,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error creating new user:", error);
		return { success: false, error: "Failed to create user" };
	}
}
