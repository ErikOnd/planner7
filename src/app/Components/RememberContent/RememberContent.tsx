"use client";

import { Spinner } from "@atoms/Spinner/Spinner";
import { Text } from "@atoms/Text/Text";
import { AddTaskModal } from "@components/AddTaskModal/AddTaskModal";
import { DraggableTaskItem } from "@components/DraggableTaskItem/DraggableTaskItem";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDraggableTodos } from "@hooks/useDraggableTodos";
import { useGeneralTodos } from "@hooks/useGeneralTodos";
import { useTodoToggle } from "@hooks/useTodoToggle";
import { useEffect, useState } from "react";
import styles from "./RememberContent.module.scss";

type RememberContentProps = {
	rememberItems?: string[];
};

export function RememberContent(props: RememberContentProps) {
	const {} = props;

	const [modalOpen, setModalOpen] = useState(false);
	const { todos, loading, deleteTodo, refresh } = useGeneralTodos();
	const { checkedTodos, handleTodoToggle } = useTodoToggle(deleteTodo);
	const { localTodos, activeTodo, sensors, handleDragStart, handleDragEnd, handleDragCancel } = useDraggableTodos(
		todos,
	);

	useEffect(() => {
		if (!modalOpen) refresh();
	}, [modalOpen, refresh]);

	return (
		<div className={styles["remember-content"]}>
			<div className={styles["task-items"]}>
				{loading
					? <Spinner size="lg" className={styles["remember-loading"]} />
					: localTodos.length === 0
					? <Text size="sm">No todos yet. Click + to add one!</Text>
					: (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							onDragCancel={handleDragCancel}
						>
							<SortableContext
								items={localTodos.map(todo => todo.id)}
								strategy={verticalListSortingStrategy}
							>
								{localTodos.map(todo => (
									<DraggableTaskItem
										key={todo.id}
										id={todo.id}
										taskName={todo.text}
										checked={checkedTodos.has(todo.id)}
										onToggleAction={checked => handleTodoToggle(todo.id, checked)}
									/>
								))}
							</SortableContext>
							<DragOverlay>
								{activeTodo
									? (
										<div className={styles["drag-overlay-item"]}>
											<Text>{activeTodo.text}</Text>
										</div>
									)
									: null}
							</DragOverlay>
						</DndContext>
					)}
			</div>
			<AddTaskModal open={modalOpen} onOpenAction={setModalOpen} />
		</div>
	);
}
