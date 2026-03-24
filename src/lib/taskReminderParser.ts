import { de, parse } from "chrono-node";

export type TaskReminderDetection = {
	matchedText: string;
	scheduledAt: Date;
	dateValue: string;
	timeValue: string;
	hasExplicitTime: boolean;
};

function pad(value: number) {
	return String(value).padStart(2, "0");
}

export function toDateInputValue(date: Date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeInputValue(date: Date) {
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function stripTaskReminderText(value: string, detection: TaskReminderDetection) {
	return value
		.replace(new RegExp(detection.matchedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "")
		.replace(/\s+/g, " ")
		.trim();
}

export function formatReminderDateTime(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

export function getTaskReminderKey(detection: TaskReminderDetection) {
	return `${detection.matchedText.toLocaleLowerCase()}::${detection.scheduledAt.toISOString()}::${
		detection.hasExplicitTime ? "time" : "date"
	}`;
}

export function detectTaskReminder(
	value: string,
	referenceDate: Date = new Date(),
): TaskReminderDetection | null {
	const text = value.trim();
	if (!text) return null;

	const results = [
		...parse(text, referenceDate, { forwardDate: true }),
		...de.parse(text, referenceDate, { forwardDate: true }),
	];

	let best: TaskReminderDetection | null = null;
	let bestScore = Number.NEGATIVE_INFINITY;

	for (const result of results) {
		const hasExplicitTime = result.start.isCertain("hour") || result.start.isCertain("minute");
		const hasExplicitDate = result.start.isCertain("day") || result.start.isCertain("weekday")
			|| result.start.isCertain("month");

		if (!hasExplicitTime && !hasExplicitDate) continue;

		const scheduledAt = result.start.date();
		if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= referenceDate) continue;

		const score = (hasExplicitTime ? 40 : 0) + Math.min(result.text.length, 30);
		if (score <= bestScore) continue;

		best = {
			matchedText: result.text.trim(),
			scheduledAt,
			dateValue: toDateInputValue(scheduledAt),
			timeValue: hasExplicitTime ? toTimeInputValue(scheduledAt) : "",
			hasExplicitTime,
		};
		bestScore = score;
	}

	return best;
}
