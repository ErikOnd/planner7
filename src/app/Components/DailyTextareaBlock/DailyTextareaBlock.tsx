"use client";

import styles from "./DailyTextareaBlock.module.scss";

import dynamic from "next/dynamic";
import React, { memo, useCallback, useEffect, useRef } from "react";
import type { NoteContent } from "types/noteContent";

const SmartEditor = dynamic(() => import("@atoms/SmartEditor/SmartEditor"), {
	ssr: false,
});

import { useNotes } from "@/contexts/NotesContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Text } from "@atoms/Text/Text";
import { formatToDayLabel } from "@utils/formatToDayLabel";
import clsx from "clsx";

type DailyTextareaProps = {
	textareaDate: Date;
	autoFocus?: boolean;
	isHighlighted?: boolean;
	mountPriority?: number;
	lazyMountOnIdle?: boolean;
};

function DailyTextareaBlockComponent(props: DailyTextareaProps) {
	const {
		textareaDate,
		autoFocus = false,
		isHighlighted = false,
		mountPriority = 0,
		lazyMountOnIdle = false,
	} = props;
	const { weekday, date } = formatToDayLabel(textareaDate);
	const isToday = textareaDate.toDateString() === new Date().toDateString();
	const textareaBlock = useRef<HTMLDivElement | null>(null);
	const editorContainerRef = useRef<HTMLDivElement | null>(null);
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const dateKey = textareaDate.toISOString().split("T")[0];
	const { activeWorkspaceId } = useWorkspace();

	const { getNote, hasNote, saveNote } = useNotes();
	const content = getNote(dateKey);
	const isLoading = !hasNote(dateKey);
	const [isEditorReady, setIsEditorReady] = React.useState(autoFocus || !lazyMountOnIdle);

	useEffect(() => {
		if (autoFocus || !lazyMountOnIdle) {
			setIsEditorReady(true);
			return;
		}

		setIsEditorReady(false);
		let cancelled = false;
		let timeoutId: number | null = null;
		let idleId: number | null = null;

		const mountEditor = () => {
			if (cancelled) return;
			setIsEditorReady(true);
		};

		if (typeof window.requestIdleCallback === "function") {
			idleId = window.requestIdleCallback(
				() => {
					mountEditor();
				},
				{ timeout: Math.min(2200, 500 + mountPriority * 220) },
			);
		} else {
			timeoutId = window.setTimeout(() => {
				mountEditor();
			}, Math.min(1200, 100 + mountPriority * 160));
		}

		return () => {
			cancelled = true;
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId);
			}
			if (idleId !== null && typeof window.cancelIdleCallback === "function") {
				window.cancelIdleCallback(idleId);
			}
		};
	}, [autoFocus, lazyMountOnIdle, mountPriority, dateKey, activeWorkspaceId]);

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
		(newContent: NoteContent) => {
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
		if (!isEditorReady) {
			setIsEditorReady(true);
			window.requestAnimationFrame(() => {
				const editorElement = container.querySelector<HTMLElement>("[contenteditable=\"true\"]");
				editorElement?.focus();
			});
			return;
		}
		const editorElement = container.querySelector<HTMLElement>("[contenteditable=\"true\"]");
		editorElement?.focus();
	}, [isEditorReady]);

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
			>
				{(isLoading || !isEditorReady) && (
					<div className={styles["editor-loading"]} aria-hidden="true">
						<div className={styles["editor-skeleton"]}>
							<span className={styles["editor-skeleton-line"]} />
							<span className={styles["editor-skeleton-line"]} />
							<span className={styles["editor-skeleton-line"]} />
							<span className={styles["editor-skeleton-line"]} />
							<span className={styles["editor-skeleton-line"]} />
						</div>
					</div>
				)}
				{!isLoading && isEditorReady && (
					<SmartEditor
						key={`${activeWorkspaceId ?? "no-workspace"}:${dateKey}`}
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
		&& prevProps.lazyMountOnIdle === nextProps.lazyMountOnIdle
	);
});
