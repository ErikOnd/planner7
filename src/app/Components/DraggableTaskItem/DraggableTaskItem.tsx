"use client";

import { TaskItem } from "@components/TaskItem/TaskItem";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { type TouchEvent, useRef } from "react";
import styles from "./DraggableTaskItem.module.scss";

const DELETE_SWIPE_THRESHOLD = 72;
const LONG_PRESS_DELAY_MS = 1000;

type DraggableTaskItemProps = {
	id: string;
	taskName: string;
	checked: boolean;
	onToggleAction: (checked: boolean) => void;
	onEdit?: () => void;
	onSwipeDelete?: () => void;
};

export function DraggableTaskItem({
	id,
	taskName,
	checked,
	onToggleAction,
	onEdit,
	onSwipeDelete,
}: DraggableTaskItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });
	const touchStartRef = useRef<{ x: number; y: number; startedAt: number } | null>(null);
	const { onTouchStart: dndTouchStart, ...restListeners } = listeners ?? {};

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
		const touch = event.touches[0];
		if (!touch) return;

		touchStartRef.current = {
			x: touch.clientX,
			y: touch.clientY,
			startedAt: Date.now(),
		};
	};

	const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
		if (!onSwipeDelete || !touchStartRef.current) {
			touchStartRef.current = null;
			return;
		}

		const touch = event.changedTouches[0];
		const start = touchStartRef.current;
		touchStartRef.current = null;
		if (!touch) return;

		const deltaX = touch.clientX - start.x;
		const deltaY = touch.clientY - start.y;
		const elapsedMs = Date.now() - start.startedAt;
		const isQuickHorizontalDeleteSwipe = elapsedMs < LONG_PRESS_DELAY_MS
			&& deltaX <= -DELETE_SWIPE_THRESHOLD
			&& Math.abs(deltaX) > Math.abs(deltaY);

		if (isQuickHorizontalDeleteSwipe) {
			onSwipeDelete();
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...restListeners}
			className={clsx(styles["draggable-task"], {
				[styles["dragging"]]: isDragging,
			})}
			onTouchStart={(e) => {
				dndTouchStart?.(e);
				handleTouchStart(e);
			}}
			onTouchEnd={handleTouchEnd}
			onTouchCancel={() => {
				touchStartRef.current = null;
			}}
		>
			<TaskItem taskName={taskName} checked={checked} onChange={onToggleAction} onEdit={onEdit} />
		</div>
	);
}
