import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureWorkspaceSession } from "@/lib/workspaces";
import { NextResponse } from "next/server";
import type { NoteContent } from "types/noteContent";

type WeeklyNotePayload = {
	date: string;
	content: NoteContent | undefined;
};

function toDateString(date: Date) {
	return date.toISOString().split("T")[0];
}

function parseDateParam(value: string | null) {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: Request) {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return NextResponse.json(
				{ success: false, error: authResult.error },
				{ status: 401 },
			);
		}

		const { searchParams } = new URL(request.url);
		const startDate = parseDateParam(searchParams.get("start"));
		const endDate = parseDateParam(searchParams.get("end"));

		if (!startDate || !endDate || startDate > endDate) {
			return NextResponse.json(
				{ success: false, error: "Invalid date range" },
				{ status: 400 },
			);
		}

		const session = await ensureWorkspaceSession(authResult.userId);
		const notes = await prisma.dailyNote.findMany({
			where: {
				userId: session.userId,
				workspaceId: session.activeWorkspaceId,
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

		const payload: WeeklyNotePayload[] = notes.map((note) => ({
			date: toDateString(note.date),
			content: note.content as NoteContent | undefined,
		}));

		return NextResponse.json(
			{ success: true, notes: payload },
			{
				headers: {
					"Cache-Control": "private, no-store",
					Vary: "Cookie",
				},
			},
		);
	} catch (error) {
		console.error("Error fetching weekly notes via API:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch weekly notes" },
			{ status: 500 },
		);
	}
}
