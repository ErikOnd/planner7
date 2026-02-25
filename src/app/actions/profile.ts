"use server";

import prisma from "@/lib/prisma";
import { withUser } from "@/lib/serverActionContext";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DO_ENDPOINT = process.env.DIGITALOCEAN_SPACES_ENDPOINT || "";
const DO_REGION = process.env.DIGITALOCEAN_SPACES_REGION || "";
const DO_KEY = process.env.DIGITALOCEAN_SPACES_KEY || "";
const DO_SECRET = process.env.DIGITALOCEAN_SPACES_SECRET || "";
const BUCKET_NAME = process.env.DIGITALOCEAN_SPACES_BUCKET || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const s3Client = DO_ENDPOINT && DO_REGION && DO_KEY && DO_SECRET
	? new S3Client({
		endpoint: DO_ENDPOINT,
		region: DO_REGION,
		credentials: {
			accessKeyId: DO_KEY,
			secretAccessKey: DO_SECRET,
		},
	})
	: null;

function createSupabaseAdminClient() {
	if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		return null;
	}

	return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	});
}

export async function checkUserExists() {
	return withUser({
		run: async ({ userId }) => {
			const profile = await prisma.profile.findUnique({
				where: { id: userId },
			});

			if (!profile) {
				return { success: false, error: "Profile not found" };
			}

			return { success: true };
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error checking if user exists:", error);
			return { success: false, error: "Failed to check user" };
		},
	});
}

export async function getUserProfile() {
	return withUser({
		run: async ({ userId }) => {
			// Get the current auth email from Supabase
			const { createClient } = await import("@utils/supabase/server");
			const supabase = await createClient();
			const { data: { user }, error: authError } = await supabase.auth.getUser();

			if (authError || !user) {
				return { success: false, error: "Failed to get auth user" };
			}

			const profile = await prisma.profile.findUnique({
				where: { id: userId },
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
					where: { id: userId },
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
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error fetching user profile:", error);
			return { success: false, error: "Failed to fetch profile" };
		},
	});
}

export async function updateUserProfile(data: { displayName?: string; email?: string }) {
	return withUser({
		run: async ({ userId }) => {
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
						id: { not: userId },
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
				where: { id: userId },
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
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error updating user profile:", error);
			return { success: false, error: "Failed to update profile" };
		},
	});
}

export async function getUserPreferences() {
	return withUser<{ success: boolean; error?: string; data?: { showWeekends: boolean; showEditorToolbar: boolean } }>({
		run: async ({ userId }) => {
			const profile = await prisma.profile.findUnique({
				where: { id: userId },
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
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error fetching user preferences:", error);
			return { success: false, error: "Failed to fetch preferences" };
		},
	});
}

export async function updateUserPreferences(data: { showWeekends?: boolean; showEditorToolbar?: boolean }) {
	return withUser<{ success: boolean; error?: string; data?: { showWeekends: boolean; showEditorToolbar: boolean } }>({
		run: async ({ userId }) => {
			const updatedProfile = await prisma.profile.update({
				where: { id: userId },
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
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error updating user preferences:", error);
			return { success: false, error: "Failed to update preferences" };
		},
	});
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

		const workspace = await prisma.workspace.create({
			data: {
				userId: user.id,
				name: "Personal",
			},
		});

		await prisma.profile.update({
			where: { id: user.id },
			data: { activeWorkspaceId: workspace.id },
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
	// Validate input
	if (!data.currentPassword || data.currentPassword.trim().length === 0) {
		return { success: false, error: "Current password is required" };
	}

	if (!data.newPassword || data.newPassword.trim().length < 8) {
		return { success: false, error: "New password must be at least 8 characters" };
	}

	return withUser({
		run: async () => {
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
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error updating password:", error);
			return { success: false, error: "Failed to update password" };
		},
	});
}

export async function deleteUserAccount() {
	return withUser({
		run: async ({ userId }) => {
			const supabaseAdmin = createSupabaseAdminClient();
			if (!supabaseAdmin) {
				return {
					success: false,
					error: "Account deletion is not configured. Missing SUPABASE_SERVICE_ROLE_KEY.",
				};
			}

			const uploads = await prisma.uploadedImage.findMany({
				where: { userId },
				select: { key: true },
			});

			if (s3Client && BUCKET_NAME && uploads.length > 0) {
				const deletions = uploads.map((upload) =>
					s3Client.send(
						new DeleteObjectCommand({
							Bucket: BUCKET_NAME,
							Key: upload.key,
						}),
					)
				);
				const results = await Promise.allSettled(deletions);
				const failed = results.filter((result) => result.status === "rejected");
				if (failed.length > 0) {
					console.error(`Failed to delete ${failed.length} uploaded file(s) for user ${userId}`);
				}
			}

			await prisma.$transaction(async (tx) => {
				// Break potential FK cycles in databases that still have an activeWorkspaceId FK.
				await tx.profile.updateMany({
					where: { id: userId },
					data: { activeWorkspaceId: null },
				});

				await tx.dailyNote.deleteMany({
					where: { userId },
				});

				await tx.generalTodo.deleteMany({
					where: { userId },
				});

				await tx.workspace.deleteMany({
					where: { userId },
				});

				await tx.uploadedImage.deleteMany({
					where: { userId },
				});

				const deleted = await tx.profile.deleteMany({
					where: { id: userId },
				});

				if (deleted.count === 0) {
					throw new Error("Profile not found.");
				}
			});

			const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
			if (authDeleteError) {
				console.error("Error deleting auth user:", authDeleteError);
				return {
					success: false,
					error: `Profile data deleted, but failed to delete auth user: ${authDeleteError.message}`,
				};
			}

			return { success: true };
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error deleting user account:", error);
			const message = error instanceof Error ? error.message : "Failed to delete account";
			return { success: false, error: message };
		},
	});
}
