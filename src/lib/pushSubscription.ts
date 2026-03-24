/**
 * Registers the service worker and saves the push subscription to the server.
 * Reuses an existing subscription if one already exists in the browser.
 * Assumes notification permission has already been granted.
 */
export async function savePushSubscription(): Promise<boolean> {
	if (typeof window === "undefined") return false;
	if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

	const registration = await navigator.serviceWorker.register("/sw.js");
	const existing = await registration.pushManager.getSubscription();
	const subscription = existing
		?? (await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
		}));

	const res = await fetch("/api/push/subscribe", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(subscription.toJSON()),
	});

	return res.ok;
}

export type ReminderNotificationPermission = "granted" | "denied" | "unsupported";

export function getReminderPermissionError(permission: ReminderNotificationPermission): string {
	if (permission === "unsupported") {
		return "Task saved, but this browser does not support notifications";
	}
	return "Task saved, but notification permission was not granted";
}

export async function ensureNotificationPermission(): Promise<ReminderNotificationPermission> {
	if (typeof window === "undefined" || !("Notification" in window)) {
		return "unsupported";
	}

	if (Notification.permission === "granted") {
		return "granted";
	}

	try {
		const permission = await Notification.requestPermission();
		return permission === "granted" ? "granted" : "denied";
	} catch {
		return "denied";
	}
}
