import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
	const authResult = await getCurrentUser();
	if (!authResult.success) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const now = new Date();
	const reminders = await prisma.reminder.findMany({
		where: {
			userId: authResult.userId,
			scheduledAt: { gt: now },
			sentAt: null,
		},
		select: { id: true, message: true, scheduledAt: true },
	});

	return NextResponse.json(reminders);
}

export async function POST(request: Request) {
	const authResult = await getCurrentUser();
	if (!authResult.success) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { message, scheduledAt } = await request.json();

	if (!message || !scheduledAt) {
		return NextResponse.json({ error: "Missing fields" }, { status: 400 });
	}

	const scheduled = new Date(scheduledAt);
	if (scheduled <= new Date()) {
		return NextResponse.json({ error: "Scheduled time is in the past" }, { status: 400 });
	}

	const reminder = await prisma.reminder.create({
		data: {
			userId: authResult.userId,
			message,
			scheduledAt: scheduled,
		},
	});

	return NextResponse.json({ ok: true, id: reminder.id });
}

export async function DELETE(request: Request) {
	const authResult = await getCurrentUser();
	if (!authResult.success) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { message, scheduledAt } = await request.json();

	if (!message || !scheduledAt) {
		return NextResponse.json({ error: "Missing fields" }, { status: 400 });
	}

	const scheduled = new Date(scheduledAt);
	if (Number.isNaN(scheduled.getTime())) {
		return NextResponse.json({ error: "Invalid scheduled time" }, { status: 400 });
	}

	await prisma.reminder.deleteMany({
		where: {
			userId: authResult.userId,
			message,
			scheduledAt: scheduled,
			sentAt: null,
		},
	});

	return NextResponse.json({ ok: true });
}
