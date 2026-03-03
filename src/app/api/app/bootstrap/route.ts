import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureWorkspaceSession } from "@/lib/workspaces";
import { isWorkspaceGradientPreset } from "@/lib/workspaceGradients";
import { NextResponse } from "next/server";
import type { AppBootstrapPayload } from "types/appBootstrap";

export const runtime = "nodejs";

function parseDateParam(value: string | null, fallback: Date) {
	if (!value) return fallback;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export async function GET(request: Request) {
	const requestStartedAt = performance.now();
	try {
		const authStartedAt = performance.now();
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
		}
		const authDuration = performance.now() - authStartedAt;

		const url = new URL(request.url);
		const today = new Date();
		const fallbackStart = new Date(today);
		fallbackStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
		const fallbackEnd = new Date(fallbackStart);
		fallbackEnd.setDate(fallbackStart.getDate() + 6);

		const startDate = parseDateParam(url.searchParams.get("startDate"), fallbackStart);
		const endDate = parseDateParam(url.searchParams.get("endDate"), fallbackEnd);
		const sessionStartedAt = performance.now();
		const session = await ensureWorkspaceSession(authResult.userId);
		const sessionDuration = performance.now() - sessionStartedAt;
		const requestedWorkspaceId = url.searchParams.get("workspaceId");
		const effectiveWorkspaceId = requestedWorkspaceId?.trim() || session.activeWorkspaceId;
		const mode = url.searchParams.get("mode");

		if (effectiveWorkspaceId !== session.activeWorkspaceId) {
			const workspace = await prisma.workspace.findFirst({
				where: {
					id: effectiveWorkspaceId,
					userId: session.userId,
				},
				select: { id: true },
			});

			if (!workspace) {
				return NextResponse.json({ success: false, error: "Workspace not found." }, { status: 404 });
			}
		}

		if (mode === "notes") {
			const notesStartedAt = performance.now();
			const notes = await prisma.dailyNote.findMany({
				where: {
					userId: session.userId,
					workspaceId: effectiveWorkspaceId,
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

			return NextResponse.json(
				{
					notes: notes.map((note) => ({
						date: note.date.toISOString(),
						content: note.content as AppBootstrapPayload["notes"][number]["content"],
					})),
				},
				{
					status: 200,
					headers: {
						"Server-Timing": [
							`auth;dur=${authDuration.toFixed(1)}`,
							`session;dur=${sessionDuration.toFixed(1)}`,
							`db-notes;dur=${(performance.now() - notesStartedAt).toFixed(1)}`,
							`total;dur=${(performance.now() - requestStartedAt).toFixed(1)}`,
						].join(", "),
					},
				},
			);
		}

		if (mode === "todos") {
			const todosStartedAt = performance.now();
			const todos = await prisma.generalTodo.findMany({
				where: {
					userId: session.userId,
					workspaceId: effectiveWorkspaceId,
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

			return NextResponse.json(
				{
					todos: todos.map((todo) => ({
						id: todo.id,
						userId: todo.userId,
						workspaceId: todo.workspaceId,
						text: todo.text,
						completed: todo.completed,
						completedAt: todo.completedAt ? todo.completedAt.toISOString() : null,
						createdAt: todo.createdAt.toISOString(),
						updatedAt: todo.updatedAt.toISOString(),
						order: todo.order,
					})),
				},
				{
					status: 200,
					headers: {
						"Server-Timing": [
							`auth;dur=${authDuration.toFixed(1)}`,
							`session;dur=${sessionDuration.toFixed(1)}`,
							`db-todos;dur=${(performance.now() - todosStartedAt).toFixed(1)}`,
							`total;dur=${(performance.now() - requestStartedAt).toFixed(1)}`,
						].join(", "),
					},
				},
			);
		}

		const fullStartedAt = performance.now();
		const [profile, workspaces, notes, todos] = await Promise.all([
			prisma.profile.findUnique({
				where: { id: session.userId },
				select: {
					email: true,
					displayName: true,
					showWeekends: true,
					showEditorToolbar: true,
				},
			}),
			prisma.workspace.findMany({
				where: { userId: session.userId },
				orderBy: [{ updatedAt: "desc" }, { createdAt: "asc" }],
				select: {
					id: true,
					name: true,
					gradientPreset: true,
					createdAt: true,
					updatedAt: true,
				},
			}),
			prisma.dailyNote.findMany({
				where: {
					userId: session.userId,
					workspaceId: effectiveWorkspaceId,
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
				select: {
					date: true,
					content: true,
				},
			}),
			prisma.generalTodo.findMany({
				where: {
					userId: session.userId,
					workspaceId: effectiveWorkspaceId,
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
			}),
		]);

		if (!profile) {
			return NextResponse.json({ success: false, error: "Profile not found." }, { status: 404 });
		}

		const payload: AppBootstrapPayload = {
			profile: {
				email: profile.email,
				displayName: profile.displayName ?? "",
				showWeekends: profile.showWeekends,
				showEditorToolbar: Boolean(profile.showEditorToolbar),
			},
			activeWorkspaceId: session.activeWorkspaceId,
			workspaces: workspaces.map((workspace) => ({
				id: workspace.id,
				name: workspace.name,
				gradientPreset: isWorkspaceGradientPreset(workspace.gradientPreset) ? workspace.gradientPreset : "violet",
				createdAt: workspace.createdAt.toISOString(),
				updatedAt: workspace.updatedAt.toISOString(),
			})),
			notes: notes.map((note) => ({
				date: note.date.toISOString(),
				content: note.content as AppBootstrapPayload["notes"][number]["content"],
			})),
			todos: todos.map((todo) => ({
				id: todo.id,
				userId: todo.userId,
				workspaceId: todo.workspaceId,
				text: todo.text,
				completed: todo.completed,
				completedAt: todo.completedAt ? todo.completedAt.toISOString() : null,
				createdAt: todo.createdAt.toISOString(),
				updatedAt: todo.updatedAt.toISOString(),
				order: todo.order,
			})),
		};

		return NextResponse.json(payload, {
			status: 200,
			headers: {
				"Server-Timing": [
					`auth;dur=${authDuration.toFixed(1)}`,
					`session;dur=${sessionDuration.toFixed(1)}`,
					`db-full;dur=${(performance.now() - fullStartedAt).toFixed(1)}`,
					`total;dur=${(performance.now() - requestStartedAt).toFixed(1)}`,
				].join(", "),
			},
		});
	} catch (error) {
		console.error("App bootstrap route crashed:", error);
		return NextResponse.json({ success: false, error: "Failed to load app bootstrap data." }, { status: 500 });
	}
}
