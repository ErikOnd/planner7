"use client";

import { savePushSubscription } from "@/lib/pushSubscription";
import { useEffect, useRef } from "react";

/**
 * Re-registers the push subscription on each app load if permission is already granted.
 * The initial subscription can happen when a todo reminder is created from the task flows.
 */
export function usePushSubscription() {
	const subscribedRef = useRef(false);

	useEffect(() => {
		if (subscribedRef.current) return;
		if (typeof window === "undefined") return;
		if (Notification.permission !== "granted") return;

		subscribedRef.current = true;
		savePushSubscription().catch(() => {
			subscribedRef.current = false;
		});
	}, []);
}
