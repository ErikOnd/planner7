"use client";

import { TaskItem } from "@components/TaskItem/TaskItem";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import styles from "./DraggableTaskItem.module.scss";

type DraggableTaskItemProps = {
	id: string;
	taskName: string;
	checked: boolean;
	onToggleAction: (checked: boolean) => void;
	onEdit?: () => void;
};

export function DraggableTaskItem({ id, taskName, checked, onToggleAction, onEdit }: DraggableTaskItemProps) {
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

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={clsx(styles["draggable-task"], {
				[styles["dragging"]]: isDragging,
			})}
		>
			<TaskItem taskName={taskName} checked={checked} onChange={onToggleAction} onEdit={onEdit} />
		</div>
	);
}
