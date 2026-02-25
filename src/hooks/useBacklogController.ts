"use client";

import { useTodoCollections } from "@hooks/useTodoCollections";
import type { GeneralTodo } from "@prisma/client";
import { useState } from "react";
import type { TodosState } from "types/todosState";

export function useBacklogController(todosState: TodosState, activeWorkspaceId: string | null) {
	const { todos, deleteTodo, updateTodoCompletion } = todosState;
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingTodo, setEditingTodo] = useState<GeneralTodo | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [isCompletedOpen, setIsCompletedOpen] = useState(false);

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

	return {
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
	};
}
