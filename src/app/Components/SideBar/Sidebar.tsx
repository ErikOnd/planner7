"use client";

import { getRandomTodoGreeting } from "@/lib/greetings";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@atoms/Button/Button";
import Checkbox from "@atoms/Checkbox/Checkbox";
import { Icon } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";
import { AddTaskModal } from "@components/AddTaskModal/AddTaskModal";
import { DeleteTodoDialog } from "@components/DeleteTodoDialog/DeleteTodoDialog";
import { DraggableTodoItem } from "@components/DraggableTodoItem/DraggableTodoItem";
import { WorkspaceSwitcher } from "@components/WorkspaceSwitcher/WorkspaceSwitcher";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDisplayName } from "@hooks/useDisplayName";
import { useKeyboardShortcut } from "@hooks/useKeyboardShortcut";
import { useTodoCollections } from "@hooks/useTodoCollections";
import type { GeneralTodo } from "@prisma/client";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useMemo, useState } from "react";
import styles from "./Sidebar.module.scss";

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

type SidebarProps = {
	todosState: TodosState;
};

export function Sidebar({ todosState }: SidebarProps) {
	const { todos, deleteTodo, addTodo, updateTodo, updateTodoCompletion, silentRefresh } = todosState;
	const { activeWorkspaceId } = useWorkspace();

	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingTodo, setEditingTodo] = useState<GeneralTodo | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [isCompletedOpen, setIsCompletedOpen] = useState(false);
	const { displayName, isResolved: isDisplayNameResolved } = useDisplayName("Planner");
	const {
		localTodos,
		activeTodo,
		sensors,
		handleDragStart,
		handleDragEnd,
		handleDragCancel,
		checkedTodos,
		handleTodoToggle,
		completedTodos,
	} = useTodoCollections(todos, updateTodoCompletion, activeWorkspaceId);
	const greeting = useMemo(() => getRandomTodoGreeting(), []);

	const handleEditTodo = (todo: GeneralTodo) => {
		setEditingTodo(todo);
		setIsAddOpen(true);
	};

	const handleModalChange = (open: boolean) => {
		setIsAddOpen(open);
		if (!open) {
			setEditingTodo(null);
		}
	};

	const handleDelete = async () => {
		if (!deleteTargetId) return;
		await deleteTodo(deleteTargetId);
		setDeleteTargetId(null);
	};

	useKeyboardShortcut({
		key: "k",
		callback: () => setIsAddOpen(true),
	});

	return (
		<div className={styles["sidebar"]}>
			<div className={styles["sticky-section"]}>
				<div className={styles["sidebar-header"]}>
					<div className={styles["brand"]}>
						<Image src="/logo-mark.svg" alt="Planner7 logo" width={48} height={48} className={styles["brand-logo"]} />
						{isDisplayNameResolved && (
							<div className={styles["brand-greeting"]}>
								<span className={styles["brand-greeting-title"]}>{greeting.headline}, {displayName}</span>
								<span className={styles["brand-greeting-subtitle"]}>{greeting.subline}</span>
							</div>
						)}
					</div>
				</div>

				<div className={styles["workspace-section"]}>
					<WorkspaceSwitcher variant="sidebar" />
				</div>

				<Button
					type="button"
					variant="secondary"
					className={styles["quick-add"]}
					onClick={() => setIsAddOpen(true)}
					aria-label="Add todo (Cmd+K)"
					aria-haspopup="dialog"
					aria-expanded={isAddOpen}
					wrapText={false}
				>
					<Icon name="plus" size={20} className={styles["quick-add-plus"]} />
					<span className={styles["quick-add-text"]}>Add task</span>
				</Button>

				<div className={styles["backlog-header"]}>
					<span className={styles["backlog-title"]}>Backlog</span>
				</div>

				<div className={styles["backlog-panel"]}>
					<div className={styles["remember-items"]}>
						{localTodos.length === 0
							? (
								<div className={styles["empty-state"]}>
									<Text size="sm">No todos yet.</Text>
									<Text size="xs" className={styles["empty-state-meta"]}>
										Press Cmd+K or click Add to create one.
									</Text>
								</div>
							)
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
											<DraggableTodoItem
												key={todo.id}
												id={todo.id}
												text={todo.text}
												checked={checkedTodos.has(todo.id)}
												onToggle={checked => handleTodoToggle(todo.id, checked)}
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
					<Button
						type="button"
						variant="secondary"
						className={styles["completed-link"]}
						onClick={() => setIsCompletedOpen(true)}
						fontWeight={600}
					>
						Completed ({completedTodos.length})
					</Button>
				</div>
			</div>
			<AddTaskModal
				open={isAddOpen}
				onOpenAction={handleModalChange}
				renderTrigger={false}
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
			<DeleteTodoDialog
				open={Boolean(deleteTargetId)}
				onOpenChange={(open) => {
					if (!open) setDeleteTargetId(null);
				}}
				onConfirm={handleDelete}
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
								<Button variant="secondary" icon="close" className={styles["completed-close"]} aria-label="Close" />
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
		</div>
	);
}
