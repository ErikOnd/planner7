import { savePushSubscription } from "@/lib/pushSubscription";

export type CreateTaskReminderResult =
	| { ok: true }
	| {
		ok: false;
		reason: "invalid_time" | "subscription_failed" | "request_failed";
	};

export async function createTaskReminder(message: string, scheduledAt: Date): Promise<CreateTaskReminderResult> {
	if (!message.trim() || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
		return { ok: false, reason: "invalid_time" };
	}

	const subscribed = await savePushSubscription();
	if (!subscribed) {
		return { ok: false, reason: "subscription_failed" };
	}

	const response = await fetch("/api/reminders", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			message,
			scheduledAt: scheduledAt.toISOString(),
		}),
	});

	if (!response.ok) {
		return { ok: false, reason: "request_failed" };
	}

	return { ok: true };
}

export async function fetchActiveReminders(): Promise<Map<string, Date>> {
	try {
		const response = await fetch("/api/reminders", { cache: "no-store" });
		if (!response.ok) return new Map();
		const data = await response.json() as { message: string; scheduledAt: string }[];
		return new Map(data.map(r => [r.message, new Date(r.scheduledAt)]));
	} catch {
		return new Map();
	}
}

export async function deleteTaskReminder(message: string, scheduledAt: Date): Promise<boolean> {
	if (!message.trim() || Number.isNaN(scheduledAt.getTime())) {
		return false;
	}

	const response = await fetch("/api/reminders", {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			message,
			scheduledAt: scheduledAt.toISOString(),
		}),
	});

	return response.ok;
}
