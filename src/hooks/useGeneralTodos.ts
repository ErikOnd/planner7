"use client";

import type { GeneralTodo } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import { deleteGeneralTodo, getGeneralTodos } from "../app/actions/generalTodos";

export function useGeneralTodos() {
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
	}, []);

	useEffect(() => {
		fetchTodos();
	}, [fetchTodos]);

	const deleteTodo = useCallback(async (todoId: string) => {
		setTodos(prev => prev.filter(todo => todo.id !== todoId));

		try {
			await deleteGeneralTodo(todoId);
		} catch (fetchError) {
			await fetchTodos();
			console.error("Error deleting todo:", fetchError);
		}
	}, [fetchTodos]);

	return {
		todos,
		loading,
		error,
		deleteTodo,
		refresh: fetchTodos
	};
}