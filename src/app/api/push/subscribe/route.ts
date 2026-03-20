import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const authResult = await getCurrentUser();
	if (!authResult.success) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const { endpoint, keys } = body;

	if (!endpoint || !keys?.p256dh || !keys?.auth) {
		return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
	}

	await prisma.pushSubscription.upsert({
		where: { endpoint },
		update: { p256dh: keys.p256dh, auth: keys.auth },
		create: {
			userId: authResult.userId,
			endpoint,
			p256dh: keys.p256dh,
			auth: keys.auth,
		},
	});

	return NextResponse.json({ ok: true });
}
