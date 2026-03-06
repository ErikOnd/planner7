import "server-only";

import prisma from "@/lib/prisma";
import { isWorkspaceGradientPreset } from "@/lib/workspaceGradients";
import type { AppBootstrapPayload, BootstrapDailyNote, BootstrapTodo } from "types/appBootstrap";

type WorkspaceScope = {
	userId: string;
	workspaceId: string;
};

type WeekScope = WorkspaceScope & {
	startDate: Date;
	endDate: Date;
};

type BootstrapPayloadParams = WeekScope & {
	activeWorkspaceId: string;
};

function mapWorkspace(item: {
	id: string;
	name: string;
	gradientPreset: string;
	createdAt: Date;
	updatedAt: Date;
}): AppBootstrapPayload["workspaces"][number] {
	return {
		id: item.id,
		name: item.name,
		gradientPreset: isWorkspaceGradientPreset(item.gradientPreset) ? item.gradientPreset : "violet",
		createdAt: item.createdAt.toISOString(),
		updatedAt: item.updatedAt.toISOString(),
	};
}

function mapDailyNote(note: {
	date: Date;
	content: unknown;
}): BootstrapDailyNote {
	return {
		date: note.date.toISOString(),
		content: note.content as AppBootstrapPayload["notes"][number]["content"],
	};
}

function mapTodo(todo: {
	id: string;
	userId: string;
	workspaceId: string;
	text: string;
	completed: boolean;
	completedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	order: number;
}): BootstrapTodo {
	return {
		id: todo.id,
		userId: todo.userId,
		workspaceId: todo.workspaceId,
		text: todo.text,
		completed: todo.completed,
		completedAt: todo.completedAt ? todo.completedAt.toISOString() : null,
		createdAt: todo.createdAt.toISOString(),
		updatedAt: todo.updatedAt.toISOString(),
		order: todo.order,
	};
}

export async function fetchWorkspaceNotes({
	userId,
	workspaceId,
	startDate,
	endDate,
}: WeekScope): Promise<BootstrapDailyNote[]> {
	const notes = await prisma.dailyNote.findMany({
		where: {
			userId,
			workspaceId,
			date: {
				gte: startDate,
				lte: endDate,
			},
		},
		select: {
			date: true,
			content: true,
		},
	});

	return notes.map(mapDailyNote);
}

export async function fetchWorkspaceTodos({
	userId,
	workspaceId,
}: WorkspaceScope): Promise<BootstrapTodo[]> {
	const todos = await prisma.generalTodo.findMany({
		where: {
			userId,
			workspaceId,
		},
		orderBy: { order: "asc" },
		select: {
			id: true,
			userId: true,
			workspaceId: true,
			text: true,
			completed: true,
			completedAt: true,
			createdAt: true,
			updatedAt: true,
			order: true,
		},
	});

	return todos.map(mapTodo);
}

export async function buildAppBootstrapPayload({
	userId,
	workspaceId,
	activeWorkspaceId,
	startDate,
	endDate,
}: BootstrapPayloadParams): Promise<AppBootstrapPayload | null> {
	const [profile, workspaces, notes, todos] = await Promise.all([
		prisma.profile.findUnique({
			where: { id: userId },
			select: {
				email: true,
				displayName: true,
				showWeekends: true,
				showEditorToolbar: true,
			},
		}),
		prisma.workspace.findMany({
			where: { userId },
			orderBy: [{ updatedAt: "desc" }, { createdAt: "asc" }],
			select: {
				id: true,
				name: true,
				gradientPreset: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		fetchWorkspaceNotes({ userId, workspaceId, startDate, endDate }),
		fetchWorkspaceTodos({ userId, workspaceId }),
	]);

	if (!profile) {
		return null;
	}

	return {
		profile: {
			email: profile.email,
			displayName: profile.displayName ?? "",
			showWeekends: profile.showWeekends,
			showEditorToolbar: Boolean(profile.showEditorToolbar),
		},
		activeWorkspaceId,
		workspaces: workspaces.map(mapWorkspace),
		notes,
		todos,
	};
}
