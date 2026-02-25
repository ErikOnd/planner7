"use server";

import prisma from "@/lib/prisma";
import { withWorkspace } from "@/lib/serverActionContext";
import type { Prisma } from "@prisma/client";
import type { NoteContent } from "types/noteContent";

export type DailyNoteResult = {
	error?: string;
	success?: boolean;
};

export async function saveDailyNote(date: string, content: NoteContent): Promise<DailyNoteResult> {
	return withWorkspace<DailyNoteResult>({
		run: async (context) => {
			const noteDate = new Date(date);

			await prisma.dailyNote.upsert({
				where: {
					userId_workspaceId_date: {
						userId: context.userId,
						workspaceId: context.activeWorkspaceId,
						date: noteDate,
					},
				},
				update: {
					content: content as Prisma.InputJsonValue,
				},
				create: {
					userId: context.userId,
					workspaceId: context.activeWorkspaceId,
					date: noteDate,
					content: content as Prisma.InputJsonValue,
				},
			});

			return {
				success: true,
			};
		},
		onAuthError: (error) => ({
			error,
			success: false,
		}),
		onError: (error) => {
			console.error("Error saving daily note:", error);
			return {
				error: "Failed to save note",
				success: false,
			};
		},
	});
}

export async function getDailyNote(date: string) {
	return withWorkspace({
		run: async (context) => {
			const noteDate = new Date(date);

			return await prisma.dailyNote.findUnique({
				where: {
					userId_workspaceId_date: {
						userId: context.userId,
						workspaceId: context.activeWorkspaceId,
						date: noteDate,
					},
				},
			});
		},
		onAuthError: () => null,
		onError: (error) => {
			console.error("Error fetching daily note:", error);
			return null;
		},
	});
}

export async function getWeeklyNotes(startDate: Date, endDate: Date) {
	return withWorkspace({
		run: async (context) => {
			return await prisma.dailyNote.findMany({
				where: {
					userId: context.userId,
					workspaceId: context.activeWorkspaceId,
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
			});
		},
		onAuthError: () => [],
		onError: (error) => {
			console.error("Error fetching weekly notes:", error);
			return [];
		},
	});
}
