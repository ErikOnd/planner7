"use client";

import Checkbox from "@atoms/Checkbox/Checkbox";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import styles from "./DraggableTodoItem.module.scss";

type DraggableTodoItemProps = {
	id: string;
	text: string;
	checked: boolean;
	onToggle: (checked: boolean) => void;
};

export function DraggableTodoItem({ id, text, checked, onToggle }: DraggableTodoItemProps) {
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
			className={clsx(styles["draggable-todo"], {
				[styles["dragging"]]: isDragging,
			})}
		>
			<Checkbox label={text} checked={checked} onChange={onToggle} />
		</div>
	);
}
