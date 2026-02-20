"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { GeneralTodo } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import { deleteGeneralTodo, getGeneralTodos, updateGeneralTodoCompletion } from "../app/actions/generalTodos";

export function useGeneralTodos() {
	const { activeWorkspaceId } = useWorkspace();
	const [todos, setTodos] = useState<GeneralTodo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchTodos = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await getGeneralTodos();
			setTodos(data);
		} catch (fetchError) {
			setError("Failed to load todos");
			console.error("Error fetching todos:", fetchError);
		} finally {
			setLoading(false);
		}
	}, [activeWorkspaceId]);

	useEffect(() => {
		fetchTodos();
	}, [fetchTodos]);

	const silentRefresh = useCallback(async () => {
		try {
			const data = await getGeneralTodos();
			setTodos(data);
		} catch (fetchError) {
			console.error("Error refreshing todos:", fetchError);
		}
	}, []);

	const deleteTodo = useCallback(async (todoId: string) => {
		setTodos(prev => prev.filter(todo => todo.id !== todoId));

		try {
			const result = await deleteGeneralTodo(todoId);
			if (!result.success) {
				await fetchTodos();
			}
		} catch (fetchError) {
			await fetchTodos();
			console.error("Error deleting todo:", fetchError);
		}
	}, [fetchTodos]);

	const addTodo = useCallback((todo: GeneralTodo) => {
		setTodos(prev => [...prev, todo]);
	}, []);

	const updateTodo = useCallback((todoId: string, text: string) => {
		setTodos(prev => prev.map(todo => todo.id === todoId ? { ...todo, text } : todo));
	}, []);

	const updateTodoCompletion = useCallback(async (todoId: string, completed: boolean) => {
		setTodos(prev =>
			prev.map(todo => (
				todo.id === todoId
					? { ...todo, completed, completedAt: completed ? new Date() : null }
					: todo
			))
		);

		try {
			const result = await updateGeneralTodoCompletion(todoId, completed);
			if (!result.success) {
				await fetchTodos();
			}
		} catch (fetchError) {
			await fetchTodos();
			console.error("Error updating todo completion:", fetchError);
		}
	}, [fetchTodos]);

	return {
		todos,
		loading,
		error,
		deleteTodo,
		addTodo,
		updateTodo,
		updateTodoCompletion,
		refresh: fetchTodos,
		silentRefresh,
	};
}
