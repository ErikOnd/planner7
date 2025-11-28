"use client";

import { Text } from "@atoms/Text/Text";
import { AddTaskModal } from "@components/AddTaskModal/AddTaskModal";
import { DraggableTaskItem } from "@components/DraggableTaskItem/DraggableTaskItem";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDraggableTodos } from "@hooks/useDraggableTodos";
import { useTodoToggle } from "@hooks/useTodoToggle";
import type { GeneralTodo } from "@prisma/client";
import { useState } from "react";
import styles from "./RememberContent.module.scss";

type TodosState = {
	todos: GeneralTodo[];
	loading: boolean;
	error: string | null;
	deleteTodo: (todoId: string) => Promise<void>;
	addTodo: (todo: GeneralTodo) => void;
	updateTodo: (todoId: string, text: string) => void;
	refresh: () => Promise<void>;
	silentRefresh: () => Promise<void>;
};

type RememberContentProps = {
	todosState: TodosState;
};

export function RememberContent(props: RememberContentProps) {
	const { todosState } = props;
	const { todos, deleteTodo, addTodo, updateTodo, silentRefresh } = todosState;

	const [modalOpen, setModalOpen] = useState(false);
	const [editingTodo, setEditingTodo] = useState<GeneralTodo | null>(null);
	const { checkedTodos, handleTodoToggle } = useTodoToggle(deleteTodo);
	const { localTodos, activeTodo, sensors, handleDragStart, handleDragEnd, handleDragCancel } = useDraggableTodos(
		todos,
	);

	const handleEditTodo = (todo: GeneralTodo) => {
		setEditingTodo(todo);
		setModalOpen(true);
	};

	const handleModalChange = (open: boolean) => {
		setModalOpen(open);
		if (!open) {
			setEditingTodo(null);
		}
	};

	return (
		<div className={styles["remember-content"]}>
			<div className={styles["task-items"]}>
				{localTodos.length === 0
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
										onEdit={() => handleEditTodo(todo)}
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
			<AddTaskModal
				open={modalOpen}
				onOpenAction={handleModalChange}
				editMode={editingTodo
					? {
						todoId: editingTodo.id,
						initialText: editingTodo.text,
					}
					: undefined}
				onOptimisticAdd={addTodo}
				onOptimisticUpdate={updateTodo}
				onSuccess={silentRefresh}
			/>
		</div>
	);
}
