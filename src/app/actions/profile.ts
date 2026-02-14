"use server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function checkUserExists() {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return { success: false, error: authResult.error };
		}

		const profile = await prisma.profile.findUnique({
			where: { id: authResult.userId },
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

export async function getUserProfile() {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return { success: false, error: authResult.error };
		}

		// Get the current auth email from Supabase
		const { createClient } = await import("@utils/supabase/server");
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError || !user) {
			return { success: false, error: "Failed to get auth user" };
		}

		const profile = await prisma.profile.findUnique({
			where: { id: authResult.userId },
			select: {
				email: true,
				displayName: true,
				showWeekends: true,
				showEditorToolbar: true,
			},
		});

		if (!profile) {
			return { success: false, error: "Profile not found" };
		}

		// Sync email from Auth to Profile table if they differ
		// This happens after user confirms their new email
		if (user.email && user.email !== profile.email) {
			await prisma.profile.update({
				where: { id: authResult.userId },
				data: { email: user.email },
			});

			return {
				success: true,
				data: {
					email: user.email,
					displayName: profile.displayName,
					showWeekends: profile.showWeekends,
					showEditorToolbar: profile.showEditorToolbar,
					pendingEmail: user.new_email || undefined,
				},
			};
		}

		return {
			success: true,
			data: {
				email: profile.email,
				displayName: profile.displayName,
				showWeekends: profile.showWeekends,
				showEditorToolbar: profile.showEditorToolbar,
				pendingEmail: user.new_email || undefined,
			},
		};
	} catch (error) {
		console.error("Error fetching user profile:", error);
		return { success: false, error: "Failed to fetch profile" };
	}
}

export async function updateUserProfile(data: { displayName?: string; email?: string }) {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return { success: false, error: authResult.error };
		}

		// Validate input
		if (data.displayName !== undefined && data.displayName.trim().length === 0) {
			return { success: false, error: "Display name cannot be empty" };
		}

		if (data.email !== undefined && !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
			return { success: false, error: "Invalid email format" };
		}

		// Check if email is already taken by another user
		if (data.email !== undefined) {
			const existingUser = await prisma.profile.findFirst({
				where: {
					email: data.email,
					id: { not: authResult.userId },
				},
			});

			if (existingUser) {
				return { success: false, error: "Email is already in use" };
			}
		}

		// Update Supabase Auth email if email is being changed
		if (data.email !== undefined) {
			const { createClient } = await import("@utils/supabase/server");
			const supabase = await createClient();

			const { error: authError } = await supabase.auth.updateUser({
				email: data.email,
			});

			if (authError) {
				return {
					success: false,
					error: `Failed to update authentication email: ${authError.message}`,
				};
			}
		}

		// Only update Profile table with displayName, NOT email
		// Email will be synced from Auth after user confirms the new email
		const updatedProfile = await prisma.profile.update({
			where: { id: authResult.userId },
			data: {
				...(data.displayName !== undefined && { displayName: data.displayName }),
			},
			select: {
				email: true,
				displayName: true,
				showWeekends: true,
				showEditorToolbar: true,
			},
		});

		return {
			success: true,
			data: {
				email: updatedProfile.email,
				displayName: updatedProfile.displayName,
				showWeekends: updatedProfile.showWeekends,
				showEditorToolbar: updatedProfile.showEditorToolbar,
			},
			emailConfirmationRequired: data.email !== undefined,
		};
	} catch (error) {
		console.error("Error updating user profile:", error);
		return { success: false, error: "Failed to update profile" };
	}
}

export async function getUserPreferences() {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return { success: false, error: authResult.error };
		}

		const profile = await prisma.profile.findUnique({
			where: { id: authResult.userId },
			select: {
				showWeekends: true,
				showEditorToolbar: true,
			},
		});

		if (!profile) {
			return { success: false, error: "Profile not found" };
		}

		return {
			success: true,
			data: {
				showWeekends: profile.showWeekends,
				showEditorToolbar: profile.showEditorToolbar,
			},
		};
	} catch (error) {
		console.error("Error fetching user preferences:", error);
		return { success: false, error: "Failed to fetch preferences" };
	}
}

export async function updateUserPreferences(data: { showWeekends?: boolean; showEditorToolbar?: boolean }) {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return { success: false, error: authResult.error };
		}

		const updatedProfile = await prisma.profile.update({
			where: { id: authResult.userId },
			data: {
				...(data.showWeekends !== undefined && { showWeekends: data.showWeekends }),
				...(data.showEditorToolbar !== undefined && { showEditorToolbar: data.showEditorToolbar }),
			},
			select: {
				showWeekends: true,
				showEditorToolbar: true,
			},
		});

		return {
			success: true,
			data: {
				showWeekends: updatedProfile.showWeekends,
				showEditorToolbar: updatedProfile.showEditorToolbar,
			},
		};
	} catch (error) {
		console.error("Error updating user preferences:", error);
		return { success: false, error: "Failed to update preferences" };
	}
}

export async function syncEmailFromAuth() {
	try {
		const { createClient } = await import("@utils/supabase/server");
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError || !user) {
			return { success: false, error: "Not authenticated" };
		}

		if (!user.email) {
			return { success: false, error: "No email found" };
		}

		// Check if profile exists
		const profile = await prisma.profile.findUnique({
			where: { id: user.id },
		});

		if (!profile) {
			return { success: false, error: "Profile not found" };
		}

		// Only update if emails differ
		if (profile.email !== user.email) {
			await prisma.profile.update({
				where: { id: user.id },
				data: { email: user.email },
			});
		}

		return { success: true };
	} catch (error) {
		console.error("Error syncing email from auth:", error);
		return { success: false, error: "Failed to sync email" };
	}
}

export async function createNewUser(displayName?: string) {
	try {
		const { createClient } = await import("@utils/supabase/server");
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError || !user) {
			return { success: false, error: "Not authenticated" };
		}

		if (!user.email_confirmed_at) {
			return { success: false, error: "Email not verified" };
		}

		const userDisplayName = displayName || (user.user_metadata?.displayName as string) || "";

		await prisma.profile.create({
			data: {
				id: user.id,
				email: user.email ?? "",
				displayName: userDisplayName,
				showEditorToolbar: true,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error creating new user:", error);
		return { success: false, error: "Failed to create user" };
	}
}

export async function updateUserPassword(data: {
	currentPassword: string;
	newPassword: string;
}) {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return { success: false, error: authResult.error };
		}

		// Validate input
		if (!data.currentPassword || data.currentPassword.trim().length === 0) {
			return { success: false, error: "Current password is required" };
		}

		if (!data.newPassword || data.newPassword.trim().length < 8) {
			return { success: false, error: "New password must be at least 8 characters" };
		}

		const { createClient } = await import("@utils/supabase/server");
		const supabase = await createClient();

		// Get user email to verify current password
		const { data: { user }, error: getUserError } = await supabase.auth.getUser();
		if (getUserError || !user?.email) {
			return { success: false, error: "Failed to get user information" };
		}

		// Verify current password by attempting to sign in
		const { error: signInError } = await supabase.auth.signInWithPassword({
			email: user.email,
			password: data.currentPassword,
		});

		if (signInError) {
			return { success: false, error: "Current password is incorrect" };
		}

		// Update to new password
		const { error: updateError } = await supabase.auth.updateUser({
			password: data.newPassword,
		});

		if (updateError) {
			return {
				success: false,
				error: `Failed to update password: ${updateError.message}`,
			};
		}

		return { success: true };
	} catch (error) {
		console.error("Error updating password:", error);
		return { success: false, error: "Failed to update password" };
	}
}
