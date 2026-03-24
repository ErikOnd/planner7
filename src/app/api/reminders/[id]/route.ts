import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const authResult = await getCurrentUser();
	if (!authResult.success) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;

	await prisma.reminder.deleteMany({
		where: { id, userId: authResult.userId },
	});

	return NextResponse.json({ ok: true });
}
