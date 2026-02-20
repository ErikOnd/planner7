"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "../app/actions/profile";

export function useDisplayName(fallback = "Planner") {
	const [displayName, setDisplayName] = useState(fallback);

	useEffect(() => {
		let mounted = true;
		const loadProfile = async () => {
			const result = await getUserProfile();
			if (!mounted || !result.success || !result.data) return;
			const name = result.data.displayName?.trim() || fallback;
			setDisplayName(name);
		};
		void loadProfile();
		return () => {
			mounted = false;
		};
	}, [fallback]);

	useEffect(() => {
		const onDisplayNameUpdated = (event: Event) => {
			const customEvent = event as CustomEvent<{ displayName?: string }>;
			const nextName = customEvent.detail?.displayName?.trim();
			if (nextName) {
				setDisplayName(nextName);
			}
		};

		window.addEventListener("profile:display-name-updated", onDisplayNameUpdated as EventListener);
		return () => {
			window.removeEventListener("profile:display-name-updated", onDisplayNameUpdated as EventListener);
		};
	}, []);

	return displayName;
}
