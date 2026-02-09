"use client";

import { Text } from "@atoms/Text/Text";
import { AddTaskModal } from "@components/AddTaskModal/AddTaskModal";
import { DraggableTaskItem } from "@components/DraggableTaskItem/DraggableTaskItem";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDraggableTodos } from "@hooks/useDraggableTodos";
import { useTodoToggle } from "@hooks/useTodoToggle";
import type { GeneralTodo } from "@prisma/client";
import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import styles from "./RememberContent.module.scss";

type TodosState = {
	todos: GeneralTodo[];
	loading: boolean;
	error: string | null;
	deleteTodo: (todoId: string) => Promise<void>;
	addTodo: (todo: GeneralTodo) => void;
	updateTodo: (todoId: string, text: string) => void;
	updateTodoCompletion: (todoId: string, completed: boolean) => Promise<void>;
	refresh: () => Promise<void>;
	silentRefresh: () => Promise<void>;
};

type RememberContentProps = {
	todosState: TodosState;
};

export function RememberContent(props: RememberContentProps) {
	const { todosState } = props;
	const { todos, addTodo, updateTodo, updateTodoCompletion, silentRefresh } = todosState;

	const [modalOpen, setModalOpen] = useState(false);
	const [editingTodo, setEditingTodo] = useState<GeneralTodo | null>(null);
	const [isCompletedOpen, setIsCompletedOpen] = useState(false);
	const activeTodos = useMemo(() => todos.filter(todo => !todo.completed), [todos]);
	const completedTodos = useMemo(() => (
		todos
			.filter(todo => todo.completed)
			.sort((a, b) => {
				const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
				const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
				return bTime - aTime;
			})
	), [todos]);
	const { localTodos, activeTodo, sensors, handleDragStart, handleDragEnd, handleDragCancel } = useDraggableTodos(
		activeTodos,
	);
	const { checkedTodos, handleTodoToggle } = useTodoToggle(updateTodoCompletion);

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
			<button
				type="button"
				className={styles["completed-link"]}
				onClick={() => setIsCompletedOpen(true)}
			>
				Completed ({completedTodos.length})
			</button>
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
			<Dialog.Root open={isCompletedOpen} onOpenChange={setIsCompletedOpen}>
				<Dialog.Portal>
					<Dialog.Overlay className={styles["completed-overlay"]} />
					<Dialog.Content className={styles["completed-dialog"]}>
						<div className={styles["completed-header"]}>
							<Dialog.Title className={styles["completed-title"]}>
								Completed Todos
							</Dialog.Title>
							<Dialog.Close asChild>
								<button type="button" className={styles["completed-close"]} aria-label="Close">
									Close
								</button>
							</Dialog.Close>
						</div>
						<div className={styles["completed-table"]}>
							{completedTodos.length === 0
								? (
									<div className={styles["completed-empty"]}>
										<Text size="sm">No completed todos yet.</Text>
									</div>
								)
								: completedTodos.map(todo => (
									<div key={todo.id} className={styles["completed-row"]}>
										<span className={styles["completed-task"]}>{todo.text}</span>
										<span className={styles["completed-date"]}>
											{todo.completedAt
												? new Date(todo.completedAt).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})
												: "—"}
										</span>
									</div>
								))}
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</div>
	);
}
