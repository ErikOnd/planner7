"use server";

import {getCurrentUser} from "@/lib/auth";
import prisma from "@/lib/prisma";
import type {Prisma} from "@prisma/client";
import {createClient} from "@utils/supabase/server";
import type {NoteContent} from "types/noteContent";

export type DailyNoteResult = {
	error?: string;
	success?: boolean;
};

async function ensureProfileExists(userId: string) {
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
		},
	});
}

export async function saveDailyNote(date: string, content: NoteContent): Promise<DailyNoteResult> {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return {
				error: authResult.error,
				success: false,
			};
		}

		await ensureProfileExists(authResult.userId);

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

		await ensureProfileExists(authResult.userId);

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

		await ensureProfileExists(authResult.userId);

		return await prisma.dailyNote.findMany({
			where: {
				userId: authResult.userId,
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
		});
	} catch (error) {
		console.error("Error fetching weekly notes:", error);
		return [];
	}
}
