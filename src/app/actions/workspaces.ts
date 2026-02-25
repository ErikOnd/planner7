"use server";

import prisma from "@/lib/prisma";
import { requireWorkspaceContext } from "@/lib/serverActionContext";
import { isWorkspaceGradientPreset, type WorkspaceGradientPreset } from "@/lib/workspaceGradients";

export type WorkspaceActionResult = {
	success: boolean;
	error?: string;
};

export type WorkspaceSummary = {
	id: string;
	name: string;
	gradientPreset: WorkspaceGradientPreset;
	createdAt: Date;
	updatedAt: Date;
};

export type WorkspacesPayload = {
	workspaces: WorkspaceSummary[];
	activeWorkspaceId: string;
};

function normalizeWorkspaceName(value: string) {
	return value.trim().replace(/\s+/g, " ");
}

function validateWorkspaceName(value: string) {
	const normalized = normalizeWorkspaceName(value);
	if (!normalized) {
		return { valid: false as const, error: "Workspace name is required" };
	}
	if (normalized.length > 60) {
		return { valid: false as const, error: "Workspace name must be 60 characters or less" };
	}
	return { valid: true as const, name: normalized };
}

async function requireWorkspaceSession() {
	const context = await requireWorkspaceContext();
	if (!context.success) {
		throw new Error(context.error);
	}
	return context;
}

export async function getWorkspaces(): Promise<WorkspacesPayload> {
	const session = await requireWorkspaceSession();
	const rows = await prisma.workspace.findMany({
		where: { userId: session.userId },
		orderBy: [{ updatedAt: "desc" }, { createdAt: "asc" }],
	});
	const workspaces: WorkspaceSummary[] = rows.map((workspace) => ({
		id: workspace.id,
		name: workspace.name,
		gradientPreset: isWorkspaceGradientPreset(workspace.gradientPreset) ? workspace.gradientPreset : "violet",
		createdAt: workspace.createdAt,
		updatedAt: workspace.updatedAt,
	}));

	return {
		workspaces,
		activeWorkspaceId: session.activeWorkspaceId,
	};
}

export async function setActiveWorkspace(workspaceId: string): Promise<WorkspaceActionResult> {
	try {
		const session = await requireWorkspaceSession();
		const workspace = await prisma.workspace.findFirst({
			where: {
				id: workspaceId,
				userId: session.userId,
			},
			select: { id: true },
		});

		if (!workspace) {
			return { success: false, error: "Workspace not found" };
		}

		await prisma.profile.update({
			where: { id: session.userId },
			data: { activeWorkspaceId: workspace.id },
		});

		return { success: true };
	} catch (error) {
		console.error("Error setting active workspace:", error);
		return { success: false, error: "Failed to set active workspace" };
	}
}

export async function createWorkspace(
	name: string,
	gradientPreset: WorkspaceGradientPreset = "violet",
): Promise<WorkspaceActionResult> {
	try {
		const validation = validateWorkspaceName(name);
		if (!validation.valid) {
			return { success: false, error: validation.error };
		}
		if (!isWorkspaceGradientPreset(gradientPreset)) {
			return { success: false, error: "Invalid workspace gradient" };
		}

		const session = await requireWorkspaceSession();

		await prisma.workspace.create({
			data: {
				userId: session.userId,
				name: validation.name,
				gradientPreset,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error creating workspace:", error);
		return { success: false, error: "Workspace name already exists" };
	}
}

export async function renameWorkspace(workspaceId: string, name: string): Promise<WorkspaceActionResult> {
	try {
		const validation = validateWorkspaceName(name);
		if (!validation.valid) {
			return { success: false, error: validation.error };
		}

		const session = await requireWorkspaceSession();
		const workspace = await prisma.workspace.findFirst({
			where: { id: workspaceId, userId: session.userId },
			select: { id: true },
		});

		if (!workspace) {
			return { success: false, error: "Workspace not found" };
		}

		await prisma.workspace.update({
			where: { id: workspace.id },
			data: { name: validation.name },
		});

		return { success: true };
	} catch (error) {
		console.error("Error renaming workspace:", error);
		return { success: false, error: "Failed to rename workspace" };
	}
}

export async function updateWorkspaceGradient(
	workspaceId: string,
	gradientPreset: WorkspaceGradientPreset,
): Promise<WorkspaceActionResult> {
	try {
		if (!isWorkspaceGradientPreset(gradientPreset)) {
			return { success: false, error: "Invalid workspace gradient" };
		}

		const session = await requireWorkspaceSession();
		const workspace = await prisma.workspace.findFirst({
			where: { id: workspaceId, userId: session.userId },
			select: { id: true },
		});

		if (!workspace) {
			return { success: false, error: "Workspace not found" };
		}

		await prisma.workspace.update({
			where: { id: workspace.id },
			data: { gradientPreset },
		});

		return { success: true };
	} catch (error) {
		console.error("Error updating workspace gradient:", error);
		return { success: false, error: "Failed to update workspace gradient" };
	}
}

export async function deleteWorkspace(workspaceId: string): Promise<WorkspaceActionResult> {
	try {
		const session = await requireWorkspaceSession();
		const workspaces = await prisma.workspace.findMany({
			where: { userId: session.userId },
			select: { id: true },
			orderBy: { createdAt: "asc" },
		});

		if (workspaces.length <= 1) {
			return { success: false, error: "You must keep at least one workspace" };
		}

		const workspace = workspaces.find((item) => item.id === workspaceId);
		if (!workspace) {
			return { success: false, error: "Workspace not found" };
		}

		const fallbackWorkspaceId = workspaces.find((item) => item.id !== workspaceId)?.id;
		if (!fallbackWorkspaceId) {
			return { success: false, error: "You must keep at least one workspace" };
		}

		await prisma.$transaction(async (tx) => {
			const profile = await tx.profile.findUnique({
				where: { id: session.userId },
				select: { activeWorkspaceId: true },
			});

			if (profile?.activeWorkspaceId === workspaceId) {
				await tx.profile.update({
					where: { id: session.userId },
					data: { activeWorkspaceId: fallbackWorkspaceId },
				});
			}

			await tx.workspace.delete({
				where: { id: workspaceId },
			});
		});

		return { success: true };
	} catch (error) {
		console.error("Error deleting workspace:", error);
		return { success: false, error: "Failed to delete workspace" };
	}
}
