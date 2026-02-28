"use client";

import { useBacklog } from "@/contexts/BacklogContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@atoms/Button/Button";
import Checkbox from "@atoms/Checkbox/Checkbox";
import { Text } from "@atoms/Text/Text";
import { AddTaskModal } from "@components/AddTaskModal/AddTaskModal";
import { DeleteTodoDialog } from "@components/DeleteTodoDialog/DeleteTodoDialog";
import { DraggableTaskItem } from "@components/DraggableTaskItem/DraggableTaskItem";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useBacklogController } from "@hooks/useBacklogController";
import * as Dialog from "@radix-ui/react-dialog";
import styles from "./RememberContent.module.scss";

export function RememberContent() {
	const todosState = useBacklog();
	const { addTodo, updateTodo, updateTodoCompletion, silentRefresh } = todosState;
	const { activeWorkspaceId } = useWorkspace();
	const {
		isAddOpen,
		editingTodo,
		deleteTargetId,
		setDeleteTargetId,
		isCompletedOpen,
		setIsCompletedOpen,
		localTodos,
		activeTodo,
		sensors,
		handleDragStart,
		handleDragEnd,
		handleDragCancel,
		checkedTodos,
		handleTodoToggle,
		completedTodos,
		handleEditTodo,
		handleModalChange,
		handleDelete,
	} = useBacklogController(todosState, activeWorkspaceId);

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
										onDelete={() => setDeleteTargetId(todo.id)}
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
				open={isAddOpen}
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
								<Button
									type="button"
									variant="secondary"
									icon="close"
									className={styles["completed-close"]}
									aria-label="Close"
								/>
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
										<Checkbox
											label={todo.text}
											checked
											onChange={(checked) => updateTodoCompletion(todo.id, checked)}
											className={styles["completed-checkbox"]}
											labelClassName={styles["completed-task"]}
										/>
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
			<DeleteTodoDialog
				open={Boolean(deleteTargetId)}
				onOpenChange={(open) => {
					if (!open) setDeleteTargetId(null);
				}}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
