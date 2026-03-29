"use client";

import { useBacklog } from "@/contexts/BacklogContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@atoms/Button/Button";
import { CalendarOverlay } from "@atoms/CalendarOverlay/CalendarOverlay";
import Checkbox from "@atoms/Checkbox/Checkbox";
import { Icon } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";
import { AddTaskModal } from "@components/AddTaskModal/AddTaskModal";
import { DeleteTodoDialog } from "@components/DeleteTodoDialog/DeleteTodoDialog";
import { DraggableTodoItem } from "@components/DraggableTodoItem/DraggableTodoItem";
import { WorkspaceSwitcher } from "@components/WorkspaceSwitcher/WorkspaceSwitcher";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useBacklogController } from "@hooks/useBacklogController";
import { useKeyboardShortcut } from "@hooks/useKeyboardShortcut";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./Sidebar.module.scss";

type SidebarProps = {
	onDateSelect?: (date: Date) => void;
	activeDate?: Date;
	showWeekends?: boolean;
};

export function Sidebar({ onDateSelect, activeDate, showWeekends = true }: SidebarProps) {
	const todosState = useBacklog();
	const { addTodo, updateTodo, updateTodoCompletion, removeTodoReminder, silentRefresh, remindersByText } = todosState;
	const [reminderDeleteTarget, setReminderDeleteTarget] = useState<{ todoId: string; text: string } | null>(null);
	const { activeWorkspaceId } = useWorkspace();
	const {
		isAddOpen,
		setIsAddOpen,
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

	useKeyboardShortcut({
		key: "k",
		callback: () => setIsAddOpen(true),
	});

	return (
		<div className={styles["sidebar"]}>
			<div className={styles["sticky-section"]}>
				<div className={styles["sidebar-header"]}>
					<div className={styles["brand"]}>
						<Image
							src="/logo-full-dark.svg"
							alt="Planner7 logo"
							width={272}
							height={50}
							className={styles["brand-logo"]}
							priority
						/>
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
					<span className={styles["quick-add-text"]}>Add Task</span>
				</Button>

				<nav className={styles["nav-section"]} aria-label="Sidebar navigation">
					{onDateSelect
						? (
							<CalendarOverlay
								onDateSelect={onDateSelect}
								activeDate={activeDate}
								showWeekends={showWeekends}
							>
								<button type="button" className={styles["nav-link"]} aria-label="Open calendar">
									<span className={styles["nav-icon"]} aria-hidden="true">
										<Icon name="calendar" size={15} />
									</span>
									<span className={styles["nav-label"]}>Calendar</span>
								</button>
							</CalendarOverlay>
						)
						: (
							<Link
								href="/app"
								className={`${styles["nav-link"]} ${styles["nav-link-active"]}`}
								aria-current="page"
							>
								<span className={styles["nav-icon"]} aria-hidden="true">
									<Icon name="calendar" size={15} />
								</span>
								<span className={styles["nav-label"]}>Calendar</span>
							</Link>
						)}
					<Link href="/app/docs" className={styles["nav-link"]}>
						<span className={styles["nav-icon"]} aria-hidden="true">
							<Icon name="editor" size={15} />
						</span>
						<span className={styles["nav-label"]}>Documents</span>
					</Link>
				</nav>

				<div className={styles["backlog-header"]}>
					<span className={styles["backlog-title"]}>Tasks</span>
					<span className={styles["backlog-count"]}>{localTodos.length}</span>
				</div>

				<div className={styles["backlog-panel"]}>
					<div className={styles["remember-items"]}>
						{localTodos.length === 0
							? (
								<div className={styles["empty-state"]}>
									<Text size="sm" className={styles["empty-state-title"]}>No todos yet.</Text>
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
												onRemoveReminder={() => setReminderDeleteTarget({ todoId: todo.id, text: todo.text })}
												onDelete={() => setDeleteTargetId(todo.id)}
												manualReminderScheduledAt={remindersByText.get(todo.text)}
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
					<div className={styles["completed-footer"]}>
						<Button
							type="button"
							variant="secondary"
							className={styles["completed-link"]}
							onClick={() => setIsCompletedOpen(true)}
							fontWeight={600}
							wrapText={false}
						>
							<span className={styles["completed-link-icon"]} aria-hidden="true" />
							<span className={styles["completed-link-text"]}>Completed Tasks</span>
						</Button>
					</div>
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
			<DeleteTodoDialog
				open={Boolean(reminderDeleteTarget)}
				onOpenChange={(open) => {
					if (!open) setReminderDeleteTarget(null);
				}}
				onConfirm={() => {
					if (reminderDeleteTarget) {
						void removeTodoReminder(reminderDeleteTarget.todoId, reminderDeleteTarget.text);
						setReminderDeleteTarget(null);
					}
				}}
				title="Remove reminder?"
				description="The reminder notification for this task will be cancelled."
				confirmLabel="Remove reminder"
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
									variant="ghost"
									size="sm"
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
		</div>
	);
}
