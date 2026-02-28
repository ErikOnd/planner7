export const DAILY_VOICE_LIMIT_SECONDS = 180;

export function getTodayUtcDateStart(): Date {
	const date = new Date();
	date.setUTCHours(0, 0, 0, 0);
	return date;
}

export function formatRemainingVoiceSeconds(seconds: number): string {
	const safeSeconds = Math.max(0, Math.floor(seconds));
	const minutes = Math.floor(safeSeconds / 60);
	const remainingSeconds = safeSeconds % 60;
	return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
