"use client";

import styles from "./DailyTextareaBlock.module.scss";

import type { Block } from "@blocknote/core";
import dynamic from "next/dynamic";
import React, { memo, useCallback, useEffect, useRef } from "react";

const SmartEditor = dynamic(() => import("@atoms/SmartEditor/SmartEditor"), {
	ssr: false,
});

import { useNotes } from "@/contexts/NotesContext";
import { Text } from "@atoms/Text/Text";
import { formatToDayLabel } from "@utils/formatToDayLabel";
import clsx from "clsx";

type DailyTextareaProps = {
	textareaDate: Date;
	autoFocus?: boolean;
	isHighlighted?: boolean;
};

function DailyTextareaBlockComponent(props: DailyTextareaProps) {
	const { textareaDate, isHighlighted = false } = props;
	const { weekday, date } = formatToDayLabel(textareaDate);
	const isToday = textareaDate.toDateString() === new Date().toDateString();
	const textareaBlock = useRef<HTMLDivElement | null>(null);
	const editorContainerRef = useRef<HTMLDivElement | null>(null);
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const dateKey = textareaDate.toISOString().split("T")[0];

	const { getNote, hasNote, saveNote } = useNotes();
	const content = getNote(dateKey);
	const isLoading = !hasNote(dateKey);

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
		if (!isHighlighted || !textareaBlock.current) return;
		const el = textareaBlock.current;
		const rect = el.getBoundingClientRect();
		const vpH = window.innerHeight || document.documentElement.clientHeight;
		const fullyInView = rect.top >= 0 && rect.bottom <= vpH;
		if (!fullyInView) {
			el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
		}
	}, [isHighlighted]);

	const handleChange = useCallback(
		(newContent: Block[]) => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			saveTimeoutRef.current = setTimeout(async () => {
				await saveNote(dateKey, newContent);
			}, 1000);
		},
		[dateKey, saveNote],
	);

	const handleEditorContainerClick = useCallback(() => {
		const container = editorContainerRef.current;
		if (!container) return;
		const editorElement = container.querySelector<HTMLElement>(".bn-editor");
		editorElement?.focus();
	}, []);

	const handleEditorContainerKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== "Tab" || event.metaKey || event.ctrlKey || event.altKey) return;

		const container = editorContainerRef.current;
		if (!container) return;

		const containers = Array.from(document.querySelectorAll<HTMLElement>(`.${styles["editor-container"]}`));
		const currentIndex = containers.indexOf(container);
		if (currentIndex === -1) return;

		event.preventDefault();

		const direction = event.shiftKey ? -1 : 1;
		const nextIndex = currentIndex + direction;
		const nextContainer = containers[nextIndex];
		if (!nextContainer) return;

		const editorElement = nextContainer.querySelector<HTMLElement>(".bn-editor");
		editorElement?.focus();
	}, []);

	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	const DailyTextareaBlockClass = clsx(
		styles["daily-textarea-block"],
		isToday && styles["is-today"],
		isHighlighted && styles["is-highlighted"],
	);

	return (
		<div ref={textareaBlock} className={DailyTextareaBlockClass}>
			<div className={styles["date"]}>
				<Text className={styles["day-batch"]}>{weekday}</Text>
				<Text className={styles["month-and-day"]}>{date}</Text>
			</div>
			<div
				ref={editorContainerRef}
				className={styles["editor-container"]}
				onClick={handleEditorContainerClick}
				onKeyDownCapture={handleEditorContainerKeyDown}
			>
				{!isLoading && (
					<SmartEditor
						key={dateKey}
						initialContent={content}
						onChange={handleChange}
						ariaLabel={`Notes for ${weekday}, ${date}`}
					/>
				)}
			</div>
		</div>
	);
}

// Memoize component to prevent re-renders when todos context updates
export const DailyTextareaBlock = memo(DailyTextareaBlockComponent, (prevProps, nextProps) => {
	// Only re-render if the date or highlight state changes
	return (
		prevProps.textareaDate.getTime() === nextProps.textareaDate.getTime()
		&& prevProps.isHighlighted === nextProps.isHighlighted
	);
});
