"use server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { NoteContent } from "types/noteContent";

export type DailyNoteResult = {
	error?: string;
	success?: boolean;
};

export async function saveDailyNote(date: string, content: NoteContent): Promise<DailyNoteResult> {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return {
				error: authResult.error,
				success: false,
			};
		}

		const noteDate = new Date(date);

		await prisma.dailyNote.upsert({
			where: {
				userId_date: {
					userId: authResult.userId,
					date: noteDate,
				},
			},
			update: {
				content: content as Prisma.InputJsonValue,
			},
			create: {
				userId: authResult.userId,
				date: noteDate,
				content: content as Prisma.InputJsonValue,
			},
		});

		return {
			success: true,
		};
	} catch (error) {
		console.error("Error saving daily note:", error);
		return {
			error: "Failed to save note",
			success: false,
		};
	}
}

export async function getDailyNote(date: string) {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return null;
		}

		const noteDate = new Date(date);

		return await prisma.dailyNote.findUnique({
			where: {
				userId_date: {
					userId: authResult.userId,
					date: noteDate,
				},
			},
		});
	} catch (error) {
		console.error("Error fetching daily note:", error);
		return null;
	}
}

export async function getWeeklyNotes(startDate: Date, endDate: Date) {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return [];
		}

		const notes = await prisma.dailyNote.findMany({
			where: {
				userId: authResult.userId,
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
		});

		return notes;
	} catch (error) {
		console.error("Error fetching weekly notes:", error);
		return [];
	}
}
