"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@utils/supabase/server";

export type WorkspaceSession = {
	userId: string;
	activeWorkspaceId: string;
};

export async function ensureProfileExists(userId: string) {
	const existingProfile = await prisma.profile.findUnique({
		where: { id: userId },
		select: { id: true },
	});

	if (existingProfile) {
		return;
	}

	const supabase = await createClient();
	const { data: { user }, error } = await supabase.auth.getUser();
	if (error || !user || user.id !== userId) {
		throw new Error("Failed to resolve authenticated user for profile bootstrap");
	}

	const fallbackEmail = `${userId}@placeholder.local`;
	const displayName = (user.user_metadata?.displayName as string | undefined) ?? "";

	await prisma.profile.upsert({
		where: { id: userId },
		update: {},
		create: {
			id: userId,
			email: user.email ?? fallbackEmail,
			displayName,
			showEditorToolbar: true,
		},
	});
}

export async function ensureWorkspaceSession(userId: string): Promise<WorkspaceSession> {
	await ensureProfileExists(userId);

	const profile = await prisma.profile.findUnique({
		where: { id: userId },
		select: { activeWorkspaceId: true },
	});

	if (!profile) {
		throw new Error("Profile not found after bootstrap");
	}

	let workspaces = await prisma.workspace.findMany({
		where: { userId },
		select: { id: true, updatedAt: true, createdAt: true },
		orderBy: [{ updatedAt: "desc" }, { createdAt: "asc" }],
	});

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

	const currentActiveWorkspaceId = profile.activeWorkspaceId;
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
