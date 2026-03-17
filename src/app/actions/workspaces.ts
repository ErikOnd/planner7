"use server";

import { buildAppBootstrapPayload } from "@/lib/bootstrapPayload";
import prisma from "@/lib/prisma";
import { requireWorkspaceContext } from "@/lib/serverActionContext";
import type { WorkspaceGradientPreset } from "@/lib/workspaceGradients";
import type { AppBootstrapPayload } from "types/appBootstrap";

export type WorkspaceActionResult = {
	success: boolean;
	error?: string;
};

export type WorkspaceSwitchBootstrapResult = WorkspaceActionResult & {
	data?: AppBootstrapPayload;
	range?: {
		startDate: string;
		endDate: string;
	};
};

export type WorkspaceSummary = {
	id: string;
	name: string;
	gradientPreset: WorkspaceGradientPreset;
	createdAt: Date;
	updatedAt: Date;
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

function toDateParam(date: Date) {
	return date.toISOString().split("T")[0];
}

function parseDateParam(value?: string) {
	if (!value) return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed;
}

function getCurrentWeekRange() {
	const today = new Date();
	const startDate = new Date(today);
	startDate.setDate(today.getDate() - ((today.getDay() + 6) % 7));
	const endDate = new Date(startDate);
	endDate.setDate(startDate.getDate() + 6);
	return { startDate, endDate };
}

async function requireWorkspaceSession() {
	const context = await requireWorkspaceContext();
	if (!context.success) {
		throw new Error(context.error);
	}
	return context;
}

export async function switchWorkspaceWithBootstrap(
	workspaceId: string,
	startDateInput?: string,
	endDateInput?: string,
): Promise<WorkspaceSwitchBootstrapResult> {
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

		const parsedStart = parseDateParam(startDateInput);
		const parsedEnd = parseDateParam(endDateInput);
		const { startDate, endDate } = parsedStart && parsedEnd
			? { startDate: parsedStart, endDate: parsedEnd }
			: getCurrentWeekRange();

		await prisma.profile.update({
			where: { id: session.userId },
			data: { activeWorkspaceId: workspace.id },
		});

		const data = await buildAppBootstrapPayload({
			userId: session.userId,
			workspaceId: workspace.id,
			activeWorkspaceId: workspace.id,
			startDate,
			endDate,
		});

		if (!data) {
			return { success: false, error: "Profile not found" };
		}

		return {
			success: true,
			range: {
				startDate: toDateParam(startDate),
				endDate: toDateParam(endDate),
			},
			data,
		};
	} catch (error) {
		console.error("Error switching workspace with bootstrap:", error);
		return { success: false, error: "Failed to switch workspace" };
	}
}

export async function createWorkspace(name: string): Promise<WorkspaceActionResult> {
	try {
		const validation = validateWorkspaceName(name);
		if (!validation.valid) {
			return { success: false, error: validation.error };
		}

		const session = await requireWorkspaceSession();

		await prisma.workspace.create({
			data: {
				userId: session.userId,
				name: validation.name,
				gradientPreset: "violet",
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
