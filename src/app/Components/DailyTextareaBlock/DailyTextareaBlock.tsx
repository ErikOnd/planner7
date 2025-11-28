"use client";

import styles from "./DailyTextareaBlock.module.scss";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useCallback, memo } from "react";
import type { Block } from "@blocknote/core";

const SmartEditor = dynamic(() => import("@atoms/SmartEditor/SmartEditor"), {
	ssr: false,
});

import { Text } from "@atoms/Text/Text";
import { formatToDayLabel } from "@utils/formatToDayLabel";
import clsx from "clsx";
import {getDailyNote, saveDailyNote} from "../../actions/dailyNotes";

type DailyTextareaProps = {
	textareaDate: Date;
	autoFocus?: boolean;
};

function DailyTextareaBlockComponent(props: DailyTextareaProps) {
	const { textareaDate } = props;
	const { weekday, date } = formatToDayLabel(textareaDate);
	const isToday = textareaDate.toDateString() === new Date().toDateString();
	const textareaBlock = useRef<HTMLDivElement | null>(null);
	const [initialContent, setInitialContent] = useState<Block[] | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(true);
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const dateKey = textareaDate.toISOString().split("T")[0];

	useEffect(() => {
		if (!isToday || !textareaBlock.current) return;
		const el = textareaBlock.current;
		const rect = el.getBoundingClientRect();
		const vpH = window.innerHeight || document.documentElement.clientHeight;
		const fullyInView = rect.top >= 0 && rect.bottom <= vpH;
		if (!fullyInView) {
			el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
		}
	}, [isToday]);

	useEffect(() => {
		const loadNote = async () => {
			setIsLoading(true);
			const dateString = textareaDate.toISOString().split("T")[0];
			const note = await getDailyNote(dateString);

			if (note && note.content) {
				setInitialContent(note.content as Block[]);
			}
			setIsLoading(false);
		};

		loadNote();
	}, [textareaDate]);

	const handleChange = useCallback(
		(content: Block[]) => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			saveTimeoutRef.current = setTimeout(async () => {
				const dateString = textareaDate.toISOString().split("T")[0];
				await saveDailyNote(dateString, content);
			}, 1000);
		},
		[textareaDate],
	);

	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	const DailyTextareaBlockClass = clsx(styles["daily-textarea-block"], isToday && styles["is-today"]);

	return (
		<div ref={textareaBlock} className={DailyTextareaBlockClass}>
			<div className={styles["date"]}>
				<Text className={styles["day-batch"]}>{weekday}</Text>
				<Text className={styles["month-and-day"]}>{date}</Text>
			</div>
			<div className={styles["editor-container"]}>
				{!isLoading && <SmartEditor key={dateKey} initialContent={initialContent} onChange={handleChange} />}
			</div>
		</div>
	);
}

// Memoize component to prevent re-renders when todos context updates
export const DailyTextareaBlock = memo(DailyTextareaBlockComponent, (prevProps, nextProps) => {
	// Only re-render if the date actually changes
	return prevProps.textareaDate.getTime() === nextProps.textareaDate.getTime();
});
