"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@utils/supabase/server";

export type WorkspaceSession = {
	userId: string;
	activeWorkspaceId: string;
};

/**
 * Ensures a Profile row exists for the given userId.
 * Returns the profile's id + activeWorkspaceId.
 * On the hot path (profile already exists) this is a single indexed lookup.
 */
export async function ensureProfileExists(
	userId: string,
): Promise<{ id: string; activeWorkspaceId: string | null }> {
	const existing = await prisma.profile.findUnique({
		where: { id: userId },
		select: { id: true, activeWorkspaceId: true },
	});
	if (existing) return existing;

	const supabase = await createClient();
	const { data: { user }, error } = await supabase.auth.getUser();
	if (error || !user || user.id !== userId) {
		throw new Error("Failed to resolve authenticated user for profile bootstrap");
	}

	const fallbackEmail = `${userId}@placeholder.local`;
	const displayName = (user.user_metadata?.displayName as string | undefined) ?? "";

	const created = await prisma.profile.upsert({
		where: { id: userId },
		update: {},
		create: {
			id: userId,
			email: user.email ?? fallbackEmail,
			displayName,
			showEditorToolbar: true,
		},
		select: { id: true, activeWorkspaceId: true },
	});
	return created;
}

/**
 * Returns (or creates) a valid workspace session for the given userId.
 *
 * Hot path optimisation: fetches Profile + Workspaces in a single JOIN query
 * instead of the previous three sequential queries.
 */
export async function ensureWorkspaceSession(userId: string): Promise<WorkspaceSession> {
	// Single query: profile + all workspaces for the user
	let profileData = await prisma.profile.findUnique({
		where: { id: userId },
		select: {
			activeWorkspaceId: true,
			workspaces: {
				select: { id: true, updatedAt: true, createdAt: true },
				orderBy: [{ updatedAt: "desc" }, { createdAt: "asc" }],
			},
		},
	});

	// Cold path: profile doesn't exist yet (first login / OAuth sign-up).
	// Use the return value from ensureProfileExists directly — no second query needed.
	// A newly created profile always has zero workspaces, so we construct profileData inline.
	if (!profileData) {
		const created = await ensureProfileExists(userId);
		profileData = { activeWorkspaceId: created.activeWorkspaceId, workspaces: [] };
	}

	if (!profileData) {
		throw new Error("Profile not found after bootstrap");
	}

	let workspaces = profileData.workspaces;

	if (workspaces.length === 0) {
		await prisma.workspace.create({
			data: {
				userId,
				name: "Personal",
			},
		});

		workspaces = await prisma.workspace.findMany({
			where: { userId },
			select: { id: true, updatedAt: true, createdAt: true },
			orderBy: [{ updatedAt: "desc" }, { createdAt: "asc" }],
		});
	}

	const currentActiveWorkspaceId = profileData.activeWorkspaceId;
	const activeStillValid = currentActiveWorkspaceId
		? workspaces.some((workspace) => workspace.id === currentActiveWorkspaceId)
		: false;
	const resolvedActiveWorkspaceId = activeStillValid
		? currentActiveWorkspaceId!
		: workspaces[0].id;

	if (currentActiveWorkspaceId !== resolvedActiveWorkspaceId) {
		await prisma.profile.update({
			where: { id: userId },
			data: { activeWorkspaceId: resolvedActiveWorkspaceId },
		});
	}

	return {
		userId,
		activeWorkspaceId: resolvedActiveWorkspaceId,
	};
}
