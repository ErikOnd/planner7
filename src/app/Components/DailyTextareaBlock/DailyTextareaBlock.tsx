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
	const monthLabel = textareaDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
	const dayNumber = String(textareaDate.getDate()).padStart(2, "0");
	const weekdayName = textareaDate.toLocaleDateString("en-US", { weekday: "long" });
	const isToday = textareaDate.toDateString() === new Date().toDateString();
	const textareaBlock = useRef<HTMLDivElement | null>(null);
	const editorContainerRef = useRef<HTMLDivElement | null>(null);
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastPersistedContentRef = useRef<NoteContent | undefined>(undefined);
	const isSavingRef = useRef(false);
	const pendingContentRef = useRef<NoteContent | null>(null);
	const dateKey = textareaDate.toISOString().split("T")[0];
	const { activeWorkspaceId } = useWorkspace();

	const { getNote, hasNote, saveNote } = useNotes();
	const content = getNote(dateKey);
	const isLoading = !hasNote(dateKey);
	const [isEditorReady, setIsEditorReady] = React.useState(autoFocus || !lazyMountOnIdle);

	useEffect(() => {
		lastPersistedContentRef.current = content;
	}, [content, dateKey, activeWorkspaceId]);

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
			if (lastPersistedContentRef.current === newContent) {
				return;
			}

			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			saveTimeoutRef.current = setTimeout(async () => {
				if (lastPersistedContentRef.current === newContent) {
					return;
				}

				if (isSavingRef.current) {
					pendingContentRef.current = newContent;
					return;
				}

				isSavingRef.current = true;
				let contentToSave: NoteContent | null = newContent;

				try {
					while (contentToSave && lastPersistedContentRef.current !== contentToSave) {
						await saveNote(dateKey, contentToSave);
						lastPersistedContentRef.current = contentToSave;
						contentToSave = pendingContentRef.current;
						pendingContentRef.current = null;
					}
				} finally {
					isSavingRef.current = false;
				}
			}, 1800);
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
			pendingContentRef.current = null;
		};
	}, []);

	const DailyTextareaBlockClass = clsx(
		styles["daily-textarea-block"],
		isToday && styles["is-today"],
		isHighlighted && styles["is-highlighted"],
	);

	return (
		<div ref={textareaBlock} className={DailyTextareaBlockClass} id={`daily-note-${dateKey}`} data-note-date={dateKey}>
			<div className={styles["date"]}>
				<div className={styles["date-content-mobile"]}>
					<span className={styles["mobile-day-pill"]}>{weekday}</span>
					<Text className={styles["mobile-date-label"]}>{date}</Text>
				</div>
				<div className={styles["date-content"]}>
					<div className={styles["day-batch"]} aria-hidden="true">
						<span className={styles["month-label"]}>{monthLabel}</span>
						<span className={styles["day-number"]}>{dayNumber}</span>
					</div>
					<span className={styles["date-divider"]} aria-hidden="true" />
					<Text className={styles["month-and-day"]}>{weekdayName}</Text>
				</div>
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
						initialContent={content}
						onChange={handleChange}
						ariaLabel={`Notes for ${weekday}, ${date}`}
						noteDate={textareaDate}
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
