"use client";

import { savePushSubscription } from "@/lib/pushSubscription";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import * as chrono from "chrono-node";
import { $getRoot } from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import styles from "./TimeReminderPlugin.module.scss";

type DetectedTime = {
	hour: number;
	minute: number;
	label: string;
	key: string;
	parsedDate: Date;
};

function parseTimesFromText(text: string): DetectedTime[] {
	const allResults = [
		...chrono.parse(text),
		...chrono.de.parse(text),
		...chrono.fr.parse(text),
		...chrono.pt.parse(text),
	];

	const seen = new Set<string>();
	const found: DetectedTime[] = [];

	for (const result of allResults) {
		const start = result.start;
		if (!start.isCertain("hour")) continue;

		const hour = start.get("hour") ?? 0;
		const minute = start.get("minute") ?? 0;
		const key = `${hour}:${minute.toString().padStart(2, "0")}`;

		if (seen.has(key)) continue;
		seen.add(key);

		found.push({
			hour,
			minute,
			label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
			key,
			parsedDate: result.start.date(),
		});
	}

	return found;
}

async function scheduleReminder(time: DetectedTime, noteDate?: Date): Promise<boolean> {
	let target = time.parsedDate;
	if (target.getTime() <= Date.now()) {
		target = noteDate ? new Date(noteDate) : new Date();
		target.setHours(time.hour, time.minute, 0, 0);
	}
	if (target.getTime() <= Date.now()) return false;

	const permission = await Notification.requestPermission();
	if (permission !== "granted") return false;

	const subscribed = await savePushSubscription();
	if (!subscribed) return false;

	const res = await fetch("/api/reminders", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			message: `Reminder: ${time.label}`,
			scheduledAt: target.toISOString(),
		}),
	});

	return res.ok;
}

type TimeReminderPluginProps = {
	noteDate?: Date;
};

export default function TimeReminderPlugin({ noteDate }: TimeReminderPluginProps) {
	const [editor] = useLexicalComposerContext();
	const [pendingTime, setPendingTime] = useState<DetectedTime | null>(null);
	const promptedKeys = useRef<Set<string>>(new Set());
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Reset prompted keys when switching to a different day's note
	useEffect(() => {
		promptedKeys.current = new Set();
		setPendingTime(null);
	}, [noteDate]);

	const checkForTimes = useCallback(() => {
		editor.read(() => {
			const text = $getRoot().getTextContent();
			const times = parseTimesFromText(text);
			const newTime = times.find((t) => !promptedKeys.current.has(t.key));
			if (newTime) setPendingTime(newTime);
		});
	}, [editor]);

	useEffect(() => {
		const unsubscribe = editor.registerUpdateListener(({ tags }) => {
			if (tags.has("external-sync")) return;
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(checkForTimes, 800);
		});

		return () => {
			unsubscribe();
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [editor, checkForTimes]);

	const handleConfirm = useCallback(async () => {
		if (!pendingTime) return;
		promptedKeys.current.add(pendingTime.key);
		setPendingTime(null);
		const scheduled = await scheduleReminder(pendingTime, noteDate);
		if (scheduled) {
			toast.success(`Reminder set for ${pendingTime.label}`);
		} else {
			toast.error("Could not set reminder — time may have already passed");
		}
	}, [pendingTime, noteDate]);

	const handleDismiss = useCallback(() => {
		if (!pendingTime) return;
		promptedKeys.current.add(pendingTime.key);
		setPendingTime(null);
	}, [pendingTime]);

	if (!pendingTime) return null;

	return (
		<div className={styles.prompt} role="dialog" aria-label="Reminder suggestion">
			<span className={styles.prompt__text}>
				Set a reminder for <strong>{pendingTime.label}</strong>?
			</span>
			<div className={styles.prompt__actions}>
				<button type="button" className={styles.prompt__confirm} onClick={handleConfirm}>
					Yes
				</button>
				<button type="button" className={styles.prompt__dismiss} onClick={handleDismiss}>
					No
				</button>
			</div>
		</div>
	);
}
