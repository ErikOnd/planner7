export const DAILY_GREETING_DISABLED_PREFIX = "planner7:daily-greeting-disabled";
export const DAILY_GREETING_LAST_SHOWN_PREFIX = "planner7:daily-greeting-last-shown";

export function getDailyGreetingDisabledKey(userEmail: string | null | undefined): string {
	const userKey = userEmail?.trim().toLowerCase() || "unknown";
	return `${DAILY_GREETING_DISABLED_PREFIX}:${userKey}`;
}

export function getDailyGreetingLastShownKey(userEmail: string | null | undefined): string {
	const userKey = userEmail?.trim().toLowerCase() || "unknown";
	return `${DAILY_GREETING_LAST_SHOWN_PREFIX}:${userKey}`;
}
