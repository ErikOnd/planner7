import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import webpush from "web-push";

export const runtime = "nodejs";

export async function GET(request: Request) {
	webpush.setVapidDetails(
		process.env.VAPID_MAILTO!,
		process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
		process.env.VAPID_PRIVATE_KEY!,
	);
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const now = new Date();
	const dueReminders = await prisma.reminder.findMany({
		where: {
			scheduledAt: { lte: now },
			sentAt: null,
		},
		include: {
			profile: {
				include: { pushSubscriptions: true },
			},
		},
	});

	const results = await Promise.allSettled(
		dueReminders.flatMap((reminder) =>
			reminder.profile.pushSubscriptions.map((sub) =>
				webpush.sendNotification(
					{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
					JSON.stringify({ title: "Planner7", body: reminder.message }),
				)
			)
		),
	);

	await prisma.reminder.updateMany({
		where: { id: { in: dueReminders.map((r) => r.id) } },
		data: { sentAt: now },
	});

	const sent = results.filter((r) => r.status === "fulfilled").length;
	const failed = results.filter((r) => r.status === "rejected").length;

	return NextResponse.json({ sent, failed });
}
