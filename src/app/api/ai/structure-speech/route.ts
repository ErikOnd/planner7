import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DAILY_VOICE_LIMIT_SECONDS, getTodayUtcDateStart } from "@/lib/voiceQuota";
import { NextResponse } from "next/server";
import { structureNotesSelection } from "../../../actions/aiNotes";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		return NextResponse.json({ success: false, error: "OPENAI_API_KEY is missing." }, { status: 500 });
	}

	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
		}
		const userId = authResult.userId;
		const usageDate = getTodayUtcDateStart();
		const voiceUsageModel = (prisma as unknown as {
			dailyVoiceUsage?: {
				findUnique: (args: {
					where: { userId_date: { userId: string; date: Date } };
				}) => Promise<{ secondsUsed: number } | null>;
				upsert: (args: {
					where: { userId_date: { userId: string; date: Date } };
					create: { userId: string; date: Date; secondsUsed: number };
					update: { secondsUsed: { increment: number } };
				}) => Promise<unknown>;
			};
		}).dailyVoiceUsage;
		const existingUsage = voiceUsageModel
			? await voiceUsageModel.findUnique({
				where: {
					userId_date: {
						userId,
						date: usageDate,
					},
				},
			})
			: null;
		if (!voiceUsageModel) {
			return NextResponse.json(
				{
					success: false,
					error: "Voice quota storage is not available. Run the latest Prisma migration.",
					remainingSeconds: 0,
					limitSeconds: DAILY_VOICE_LIMIT_SECONDS,
					quotaEnabled: false,
				},
				{ status: 503 },
			);
		}
		const usedBefore = existingUsage?.secondsUsed ?? 0;
		const remainingBefore = Math.max(0, DAILY_VOICE_LIMIT_SECONDS - usedBefore);
		if (remainingBefore <= 0) {
			return NextResponse.json(
				{
					success: false,
					error: "You have reached your daily voice limit (3 minutes).",
					remainingSeconds: 0,
					limitSeconds: DAILY_VOICE_LIMIT_SECONDS,
				},
				{ status: 429 },
			);
		}

		const formData = await request.formData();
		const audioFile = formData.get("file");
		const durationSecondsRaw = formData.get("durationSeconds");
		const durationSeconds = typeof durationSecondsRaw === "string"
			? Number.parseInt(durationSecondsRaw, 10)
			: Number.NaN;

		if (!(audioFile instanceof File)) {
			return NextResponse.json({ success: false, error: "No audio file provided." }, { status: 400 });
		}

		const transcriptionPayload = new FormData();
		transcriptionPayload.append("model", "gpt-4o-mini-transcribe");
		transcriptionPayload.append("file", audioFile);
		transcriptionPayload.append("response_format", "json");

		const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
			body: transcriptionPayload,
		});

		if (!transcriptionResponse.ok) {
			const body = await transcriptionResponse.text();
			let message = "Speech transcription failed.";
			try {
				const parsed = JSON.parse(body) as { error?: { message?: string } };
				if (parsed.error?.message) message = parsed.error.message;
			} catch {
				// keep fallback
			}
			console.error("OpenAI speech transcription failed:", transcriptionResponse.status, body);
			return NextResponse.json({ success: false, error: message }, { status: 500 });
		}

		const transcriptionJson = (await transcriptionResponse.json()) as { text?: string };
		const transcript = transcriptionJson.text?.trim();
		if (!transcript) {
			return NextResponse.json({ success: false, error: "No speech was detected." }, { status: 400 });
		}

		const fallbackByWords = Math.max(1, Math.ceil(transcript.split(/\s+/).filter(Boolean).length / 2.5));
		const chargedSeconds = Number.isFinite(durationSeconds) && durationSeconds > 0 && durationSeconds <= 600
			? durationSeconds
			: fallbackByWords;
		const nextUsed = usedBefore + chargedSeconds;
		if (nextUsed > DAILY_VOICE_LIMIT_SECONDS) {
			return NextResponse.json(
				{
					success: false,
					error: "Daily voice limit exceeded. Try again tomorrow.",
					remainingSeconds: remainingBefore,
					limitSeconds: DAILY_VOICE_LIMIT_SECONDS,
				},
				{ status: 429 },
			);
		}

		const structured = await structureNotesSelection(transcript);
		if (!structured.success) {
			return NextResponse.json({ success: false, error: structured.error }, { status: 500 });
		}

		await voiceUsageModel.upsert({
			where: {
				userId_date: {
					userId,
					date: usageDate,
				},
			},
			create: {
				userId,
				date: usageDate,
				secondsUsed: chargedSeconds,
			},
			update: {
				secondsUsed: {
					increment: chargedSeconds,
				},
			},
		});

		const remainingSeconds = Math.max(0, DAILY_VOICE_LIMIT_SECONDS - nextUsed);

		return NextResponse.json({
			success: true,
			transcript,
			data: structured.data,
			remainingSeconds,
			limitSeconds: DAILY_VOICE_LIMIT_SECONDS,
			quotaEnabled: true,
		});
	} catch (error) {
		console.error("Speech structure route crashed:", error);
		return NextResponse.json({ success: false, error: "Speech processing failed." }, { status: 500 });
	}
}
