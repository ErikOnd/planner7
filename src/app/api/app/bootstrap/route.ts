import { getCurrentUser } from "@/lib/auth";
import { buildAppBootstrapPayload, fetchWorkspaceNotes, fetchWorkspaceTodos } from "@/lib/bootstrapPayload";
import prisma from "@/lib/prisma";
import { ensureWorkspaceSession } from "@/lib/workspaces";
import { NextResponse } from "next/server";

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
			const notes = await fetchWorkspaceNotes({
				userId: session.userId,
				workspaceId: effectiveWorkspaceId,
				startDate,
				endDate,
			});

			return NextResponse.json(
				{ notes },
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
			const todos = await fetchWorkspaceTodos({
				userId: session.userId,
				workspaceId: effectiveWorkspaceId,
			});

			return NextResponse.json(
				{ todos },
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
		const payload = await buildAppBootstrapPayload({
			userId: session.userId,
			workspaceId: effectiveWorkspaceId,
			activeWorkspaceId: session.activeWorkspaceId,
			startDate,
			endDate,
		});

		if (!payload) {
			return NextResponse.json({ success: false, error: "Profile not found." }, { status: 404 });
		}

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
