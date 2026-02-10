"use client";

import { Button } from "@atoms/Button/Button";
import { Text } from "@atoms/Text/Text";
import { AddTaskModal } from "@components/AddTaskModal/AddTaskModal";
import { DraggableTodoItem } from "@components/DraggableTodoItem/DraggableTodoItem";
import WeeklySlider from "@components/WeeklySlider/WeeklySlider";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDraggableTodos } from "@hooks/useDraggableTodos";
import { useKeyboardShortcut } from "@hooks/useKeyboardShortcut";
import { useTodoToggle } from "@hooks/useTodoToggle";
import type { GeneralTodo } from "@prisma/client";
import * as Dialog from "@radix-ui/react-dialog";
import Checkbox from "@atoms/Checkbox/Checkbox";
import { AlertDialog } from "radix-ui";
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
	baseDate: Date;
	setBaseDateAction: (date: Date) => void;
	rangeLabel: string;
	todosState: TodosState;
};

export function Sidebar({ baseDate, setBaseDateAction, rangeLabel, todosState }: SidebarProps) {
	const { todos, deleteTodo, addTodo, updateTodo, updateTodoCompletion, silentRefresh } = todosState;

	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingTodo, setEditingTodo] = useState<GeneralTodo | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
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
				<div className={styles["section"]}>
					<div className={styles["week-slider-section"]}>
						<WeeklySlider baseDate={baseDate} rangeLabel={rangeLabel} setBaseDate={setBaseDateAction} />
					</div>
				</div>

				<div className={styles["section"]}>
					<div className={styles["remember-header-row"]}>
						<div className={styles["remember-header"]}>General Todos</div>
						<div className={styles["remember-actions"]}>
							<Button
								variant="secondary"
								onClick={() => setIsAddOpen(true)}
								aria-label="Add todo (Cmd+K)"
								aria-haspopup="dialog"
								aria-expanded={isAddOpen}
								className={styles["add-header-button"]}
							>
								<span className={styles["add-label"]}>+ Add</span>
							</Button>
						</div>
					</div>

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
					<button
						type="button"
						className={styles["completed-link"]}
						onClick={() => setIsCompletedOpen(true)}
					>
						Completed ({completedTodos.length})
					</button>
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
			<AlertDialog.Root
				open={Boolean(deleteTargetId)}
				onOpenChange={(open) => {
					if (!open) setDeleteTargetId(null);
				}}
			>
				<AlertDialog.Portal>
					<AlertDialog.Overlay className={styles["delete-overlay"]} />
					<AlertDialog.Content className={styles["delete-dialog"]}>
						<AlertDialog.Title className={styles["delete-title"]}>
							Delete todo?
						</AlertDialog.Title>
						<AlertDialog.Description className={styles["delete-description"]}>
							This action cannot be undone.
						</AlertDialog.Description>
						<div className={styles["delete-actions"]}>
							<AlertDialog.Cancel asChild>
								<Button variant="secondary" fontWeight={500}>Cancel</Button>
							</AlertDialog.Cancel>
							<AlertDialog.Action asChild>
								<Button className={styles["delete-button"]} onClick={handleDelete} fontWeight={700} autoFocus>
									Delete
								</Button>
							</AlertDialog.Action>
						</div>
					</AlertDialog.Content>
				</AlertDialog.Portal>
			</AlertDialog.Root>
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
