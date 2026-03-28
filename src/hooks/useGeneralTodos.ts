"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { invalidateWorkspaceTodosCache, loadWorkspaceTodos } from "@/lib/clientBootstrap";
import { logClientPerf } from "@/lib/perf";
import { deleteTaskReminder, fetchActiveReminders } from "@/lib/taskReminderClient";
import { detectTaskReminder, stripTaskReminderText } from "@/lib/taskReminderParser";
import type { GeneralTodo } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { deleteGeneralTodo, saveGeneralTodo, updateGeneralTodoCompletion } from "../app/actions/generalTodos";

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
	const [remindersByText, setRemindersByText] = useState<Map<string, Date>>(new Map());
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const requestCounterRef = useRef(0);

	const fetchTodos = useCallback(async (opts?: { force?: boolean; silent?: boolean }) => {
		if (!activeWorkspaceId) {
			setTodos([]);
			setLoading(false);
			return;
		}

		const requestId = ++requestCounterRef.current;
		const startedAt = performance.now();
		if (!opts?.silent) {
			setLoading(true);
			setError(null);
		}
		try {
			const [data, reminders] = await Promise.all([
				loadWorkspaceTodos({ workspaceId: activeWorkspaceId, force: opts?.force }),
				fetchActiveReminders(),
			]);
			if (requestId !== requestCounterRef.current) return;
			setTodos(data.map(toGeneralTodo));
			setRemindersByText(reminders);
			if (!opts?.silent) {
				logClientPerf("todos.load", startedAt, {
					workspaceId: activeWorkspaceId,
					count: data.length,
				});
			}
		} catch (fetchError) {
			if (requestId !== requestCounterRef.current) return;
			if (!opts?.silent) {
				setError("Failed to load todos");
			}
			console.error("Error fetching todos:", fetchError);
		} finally {
			if (!opts?.silent) {
				const isLatestRequest = requestId === requestCounterRef.current;
				if (isLatestRequest) {
					setLoading(false);
				}
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
	}, [activeWorkspaceId, fetchTodos, remindersByText, todos]);

	const silentRefresh = useCallback(() => fetchTodos({ force: true, silent: true }), [fetchTodos]);

	const deleteTodo = useCallback(async (todoId: string) => {
		const todo = todos.find(t => t.id === todoId);
		setTodos(prev => prev.filter(t => t.id !== todoId));

		try {
			const result = await deleteGeneralTodo(todoId);
			if (!result.success) {
				await fetchTodos();
			} else {
				invalidateWorkspaceTodosCache(activeWorkspaceId ?? undefined);
				if (todo) {
					const reminderScheduledAt = remindersByText.get(todo.text);
					if (reminderScheduledAt) {
						await deleteTaskReminder(todo.text, reminderScheduledAt);
						setRemindersByText(prev => {
							const next = new Map(prev);
							next.delete(todo.text);
							return next;
						});
					}
				}
			}
		} catch (fetchError) {
			await fetchTodos();
			console.error("Error deleting todo:", fetchError);
		}
	}, [activeWorkspaceId, fetchTodos, remindersByText, todos]);

	const addTodo = useCallback((todo: GeneralTodo) => {
		setTodos(prev => [...prev, todo]);
	}, []);

	const updateTodo = useCallback((todoId: string, text: string) => {
		setTodos(prev => prev.map(todo => todo.id === todoId ? { ...todo, text } : todo));
	}, []);

	const removeTodoReminder = useCallback(async (todoId: string, text: string) => {
		const inlineReminder = detectTaskReminder(text);
		const manualScheduledAt = remindersByText.get(text);

		if (!inlineReminder && !manualScheduledAt) return;

		// For manual (picker) reminders: just delete the Reminder row, no text change needed
		if (!inlineReminder && manualScheduledAt) {
			try {
				const deleted = await deleteTaskReminder(text, manualScheduledAt);
				if (!deleted) {
					toast.error("Could not remove reminder");
					return;
				}
				setRemindersByText(prev => {
					const next = new Map(prev);
					next.delete(text);
					return next;
				});
			} catch (err) {
				console.error("Error removing manual reminder:", err);
				toast.error("Could not remove reminder");
			}
			return;
		}

		// For inline (natural language) reminders: strip the date text and update the task
		const nextText = stripTaskReminderText(text, inlineReminder!);
		if (!nextText) {
			toast.error("Remove the reminder words from the task text manually.");
			return;
		}

		setTodos(prev => prev.map(todo => todo.id === todoId ? { ...todo, text: nextText } : todo));

		try {
			const formData = new FormData();
			formData.set("todoId", todoId);
			formData.set("text", nextText);

			const updateResult = await saveGeneralTodo({ error: undefined }, formData);
			if (!updateResult.success) {
				throw new Error(updateResult.error ?? "Failed to update task");
			}

			const deleted = await deleteTaskReminder(text, inlineReminder!.scheduledAt);
			if (!deleted) {
				toast.error("Task updated, but the reminder could not be removed");
			}

			invalidateWorkspaceTodosCache(activeWorkspaceId ?? undefined);
		} catch (updateError) {
			await fetchTodos();
			console.error("Error removing todo reminder:", updateError);
			toast.error("Could not remove reminder");
		}
	}, [activeWorkspaceId, fetchTodos, remindersByText]);

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
		remindersByText,
		loading,
		error,
		deleteTodo,
		addTodo,
		updateTodo,
		removeTodoReminder,
		updateTodoCompletion,
		refresh: fetchTodos,
		silentRefresh,
	};
}
