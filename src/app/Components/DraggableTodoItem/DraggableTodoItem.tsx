"use client";

import Checkbox from "@atoms/Checkbox/Checkbox";
import { Icon } from "@atoms/Icons/Icon";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import styles from "./DraggableTodoItem.module.scss";

type DraggableTodoItemProps = {
	id: string;
	text: string;
	checked: boolean;
	onToggle: (checked: boolean) => void;
	onEdit?: () => void;
	onDelete?: () => void;
};

export function DraggableTodoItem({ id, text, checked, onToggle, onEdit, onDelete }: DraggableTodoItemProps) {
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
			<div className={styles["todo-content"]}>
				<Checkbox
					label={text}
					checked={checked}
					onChange={onToggle}
					className={styles["todo-checkbox"]}
					labelClassName={styles["todo-label"]}
				/>
				<div className={styles["action-buttons"]}>
					{onEdit && (
						<button
							className={styles["edit-button"]}
							onClick={onEdit}
							aria-label="Edit task"
							type="button"
						>
							<Icon name="pencil" />
						</button>
					)}
					{onDelete && (
						<button
							className={styles["delete-button"]}
							onClick={onDelete}
							aria-label="Delete task"
							type="button"
						>
							<Icon name="trash" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
