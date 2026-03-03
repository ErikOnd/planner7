"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { invalidateWorkspaceTodosCache, loadWorkspaceTodos } from "@/lib/clientBootstrap";
import { logClientPerf } from "@/lib/perf";
import type { GeneralTodo } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteGeneralTodo, updateGeneralTodoCompletion } from "../app/actions/generalTodos";

function toGeneralTodo(todo: {
	id: string;
	userId: string;
	workspaceId: string;
	text: string;
	completed: boolean;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
	order: number;
}): GeneralTodo {
	return {
		id: todo.id,
		userId: todo.userId,
		workspaceId: todo.workspaceId,
		text: todo.text,
		completed: todo.completed,
		completedAt: todo.completedAt ? new Date(todo.completedAt) : null,
		createdAt: new Date(todo.createdAt),
		updatedAt: new Date(todo.updatedAt),
		order: todo.order,
	};
}

export function useGeneralTodos() {
	const { activeWorkspaceId } = useWorkspace();
	const [todos, setTodos] = useState<GeneralTodo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const requestCounterRef = useRef(0);

	const fetchTodos = useCallback(async () => {
		if (!activeWorkspaceId) {
			setTodos([]);
			setLoading(false);
			return;
		}

		const requestId = ++requestCounterRef.current;
		const startedAt = performance.now();
		setLoading(true);
		setError(null);
		try {
			const data = await loadWorkspaceTodos({ workspaceId: activeWorkspaceId });
			if (requestId !== requestCounterRef.current) return;
			setTodos(data.map(toGeneralTodo));
			logClientPerf("todos.load", startedAt, {
				workspaceId: activeWorkspaceId,
				count: data.length,
			});
		} catch (fetchError) {
			if (requestId !== requestCounterRef.current) return;
			setError("Failed to load todos");
			console.error("Error fetching todos:", fetchError);
		} finally {
			const isLatestRequest = requestId === requestCounterRef.current;
			if (isLatestRequest) {
				setLoading(false);
			}
		}
	}, [activeWorkspaceId]);

	useEffect(() => {
		setTodos([]);
		setError(null);
		if (!activeWorkspaceId) {
			setLoading(false);
			return;
		}
		fetchTodos();
	}, [activeWorkspaceId, fetchTodos]);

	const silentRefresh = useCallback(async () => {
		if (!activeWorkspaceId) return;

		const requestId = ++requestCounterRef.current;
		try {
			const data = await loadWorkspaceTodos({ workspaceId: activeWorkspaceId });
			if (requestId !== requestCounterRef.current) return;
			setTodos(data.map(toGeneralTodo));
		} catch (fetchError) {
			if (requestId !== requestCounterRef.current) return;
			console.error("Error refreshing todos:", fetchError);
		}
	}, [activeWorkspaceId]);

	const deleteTodo = useCallback(async (todoId: string) => {
		setTodos(prev => prev.filter(todo => todo.id !== todoId));

		try {
			const result = await deleteGeneralTodo(todoId);
			if (!result.success) {
				await fetchTodos();
			} else {
				invalidateWorkspaceTodosCache(activeWorkspaceId ?? undefined);
			}
		} catch (fetchError) {
			await fetchTodos();
			console.error("Error deleting todo:", fetchError);
		}
	}, [activeWorkspaceId, fetchTodos]);

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
			} else {
				invalidateWorkspaceTodosCache(activeWorkspaceId ?? undefined);
			}
		} catch (fetchError) {
			await fetchTodos();
			console.error("Error updating todo completion:", fetchError);
		}
	}, [activeWorkspaceId, fetchTodos]);

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
