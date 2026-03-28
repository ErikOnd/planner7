import { toDateInputValue } from "@/lib/taskReminderParser";

export type ReminderSeed = {
	message: string;
	scheduledAt: Date;
};

export type ReminderPickerStep = "calendar" | "time";

export function todayDateString() {
	return toDateInputValue(new Date());
}

export function formatDateLabel(dateStr: string): string {
	const today = todayDateString();
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const tomorrowStr = toDateInputValue(tomorrow);

	if (dateStr === today) return "Today";
	if (dateStr === tomorrowStr) return "Tomorrow";
	return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateTimeChipLabel(dateStr: string, timeStr: string) {
	return timeStr ? `${formatDateLabel(dateStr)} · ${timeStr}` : formatDateLabel(dateStr);
}

export function formatTimePart(value: number) {
	return String(value).padStart(2, "0");
}

export function formatTimeValue(hour: number, minute: number) {
	return `${formatTimePart(hour)}:${formatTimePart(minute)}`;
}

export function parseTimeValue(timeStr: string) {
	const [rawHour = "9", rawMinute = "30"] = timeStr.split(":");
	const parsedHour = Number.parseInt(rawHour, 10);
	const parsedMinute = Number.parseInt(rawMinute, 10);

	return {
		hour: Number.isNaN(parsedHour) ? 9 : parsedHour,
		minute: Number.isNaN(parsedMinute) ? 30 : parsedMinute,
	};
}

export function getSuggestedReminderTime(dateStr: string, timeStr?: string) {
	if (timeStr) return timeStr;

	if (dateStr !== todayDateString()) {
		return "09:30";
	}

	const nextSlot = new Date(Date.now() + 30 * 60 * 1000);
	nextSlot.setSeconds(0, 0);

	const roundedMinutes = Math.ceil(nextSlot.getMinutes() / 5) * 5;

	if (roundedMinutes >= 60) {
		nextSlot.setHours(nextSlot.getHours() + 1, 0, 0, 0);
	} else {
		nextSlot.setMinutes(roundedMinutes, 0, 0);
	}

	return formatTimeValue(nextSlot.getHours(), nextSlot.getMinutes());
}

export function toLocalDateValue(dateStr: string) {
	return new Date(`${dateStr}T00:00:00`);
}

export function sanitizeTimeInput(value: string) {
	return value.replace(/\D/g, "").slice(0, 2);
}

export function parseTimeInput(value: string, fallback: number, max: number) {
	if (!value) return fallback;

	const parsedValue = Number.parseInt(value, 10);

	if (Number.isNaN(parsedValue)) return fallback;
	if (parsedValue < 0) return 0;
	if (parsedValue > max) return max;

	return parsedValue;
}
