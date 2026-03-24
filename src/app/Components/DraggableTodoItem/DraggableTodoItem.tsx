"use client";

import { detectTaskReminder, stripTaskReminderText, type TaskReminderDetection } from "@/lib/taskReminderParser";
import Checkbox from "@atoms/Checkbox/Checkbox";
import { Icon } from "@atoms/Icons/Icon";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { useMemo } from "react";
import styles from "./DraggableTodoItem.module.scss";

function formatBadgeLabel(detection: TaskReminderDetection): string {
	const date = detection.scheduledAt;
	const pad = (n: number) => String(n).padStart(2, "0");
	const timeStr = detection.hasExplicitTime
		? `${pad(date.getHours())}:${pad(date.getMinutes())}`
		: "";

	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const diffDays = Math.round((targetStart.getTime() - todayStart.getTime()) / 86400000);

	if (diffDays === 0) return timeStr || "Today";
	if (diffDays === 1) return timeStr ? `Tomorrow · ${timeStr}` : "Tomorrow";
	if (diffDays < 7) {
		const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
		return timeStr ? `${weekday} · ${timeStr}` : weekday;
	}
	const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	return timeStr ? `${dateStr} · ${timeStr}` : dateStr;
}

type DraggableTodoItemProps = {
	id: string;
	text: string;
	checked: boolean;
	onToggle: (checked: boolean) => void;
	onEdit?: () => void;
	onRemoveReminder?: () => void;
	onDelete?: () => void;
	manualReminderScheduledAt?: Date;
};

export function DraggableTodoItem(
	{ id, text, checked, onToggle, onEdit, onRemoveReminder, onDelete, manualReminderScheduledAt }:
		DraggableTodoItemProps,
) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const reminder = useMemo(() => detectTaskReminder(text), [text]);
	const displayText = useMemo(() => {
		if (!reminder) return text;
		return stripTaskReminderText(text, reminder);
	}, [text, reminder]);
	const badgeLabel = useMemo(() => {
		if (reminder) return formatBadgeLabel(reminder);
		if (manualReminderScheduledAt && manualReminderScheduledAt > new Date()) {
			return formatBadgeLabel({
				scheduledAt: manualReminderScheduledAt,
				hasExplicitTime: true,
				matchedText: "",
				dateValue: "",
				timeValue: "",
			});
		}
		return null;
	}, [reminder, manualReminderScheduledAt]);

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={clsx(styles["draggable-todo"], {
				[styles["dragging"]]: isDragging,
			})}
		>
			<div className={styles["todo-content"]}>
				<div className={styles["todo-main"]}>
					<Checkbox
						label={displayText}
						checked={checked}
						onChange={onToggle}
						className={styles["todo-checkbox"]}
						labelClassName={styles["todo-label"]}
					/>
					{badgeLabel && (
						<button
							type="button"
							className={styles["todo-reminder"]}
							onClick={onRemoveReminder}
							onPointerDown={(event) => event.stopPropagation()}
							aria-label={`Remove reminder ${badgeLabel}`}
						>
							<Icon name="calendar" size={11} />
							<span>{badgeLabel}</span>
							<span className={styles["todo-reminder-close"]}>
								<Icon name="close" size={9} />
							</span>
						</button>
					)}
				</div>
				<div className={styles["action-buttons"]}>
					{onEdit && (
						<button
							className={styles["edit-button"]}
							onClick={onEdit}
							aria-label="Edit task"
							type="button"
						>
							<Icon name="pencil" size={13} />
						</button>
					)}
					{onDelete && (
						<button
							className={styles["delete-button"]}
							onClick={onDelete}
							aria-label="Delete task"
							type="button"
						>
							<Icon name="trash" size={13} />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
