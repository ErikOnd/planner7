"use server";

import prisma from "@/lib/prisma";
import {createClient} from "@utils/supabase/server";
import type {Block} from "@blocknote/core";

export type DailyNoteResult = {
	error?: string;
	success?: boolean;
};

export async function saveDailyNote(date: string, content: Block[]): Promise<DailyNoteResult> {
	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError || !user) {
			return {
				error: "You must be logged in to save a note",
				success: false,
			};
		}

		const noteDate = new Date(date);

		await prisma.dailyNote.upsert({
			where: {
				userId_date: {
					userId: user.id,
					date: noteDate,
				},
			},
			update: {
				content: content,
			},
			create: {
				userId: user.id,
				date: noteDate,
				content: content,
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
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError || !user) {
			return null;
		}

		const noteDate = new Date(date);

		return await prisma.dailyNote.findUnique({
			where: {
				userId_date: {
					userId: user.id,
					date: noteDate,
				},
			},
		});
	} catch (error) {
		console.error("Error fetching daily note:", error);
		return null;
	}
}
