import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DAILY_VOICE_LIMIT_SECONDS, getTodayUtcDateStart } from "@/lib/voiceQuota";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
		}

		const voiceUsageModel = (prisma as unknown as {
			dailyVoiceUsage?: {
				findUnique: (args: {
					where: { userId_date: { userId: string; date: Date } };
				}) => Promise<{ secondsUsed: number } | null>;
			};
		}).dailyVoiceUsage;

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

		const usage = await voiceUsageModel.findUnique({
			where: {
				userId_date: {
					userId: authResult.userId,
					date: getTodayUtcDateStart(),
				},
			},
		});

		const usedSeconds = usage?.secondsUsed ?? 0;
		const remainingSeconds = Math.max(0, DAILY_VOICE_LIMIT_SECONDS - usedSeconds);

		return NextResponse.json({
			success: true,
			usedSeconds,
			remainingSeconds,
			limitSeconds: DAILY_VOICE_LIMIT_SECONDS,
		});
	} catch (error) {
		console.error("Voice usage route crashed:", error);
		return NextResponse.json({ success: false, error: "Could not load voice usage." }, { status: 500 });
	}
}
