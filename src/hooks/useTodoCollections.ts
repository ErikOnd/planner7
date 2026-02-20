"use client";

import type { GeneralTodo } from "@prisma/client";
import { useMemo } from "react";
import { useDraggableTodos } from "./useDraggableTodos";
import { useTodoToggle } from "./useTodoToggle";

export function useTodoCollections(
	todos: GeneralTodo[],
	updateTodoCompletion: (todoId: string, completed: boolean) => Promise<void>,
) {
	const activeTodos = useMemo(() => todos.filter((todo) => !todo.completed), [todos]);
	const completedTodos = useMemo(
		() =>
			todos
				.filter((todo) => todo.completed)
				.sort((a, b) => {
					const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
					const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
					return bTime - aTime;
				}),
		[todos],
	);

	const draggable = useDraggableTodos(activeTodos);
	const toggle = useTodoToggle(updateTodoCompletion);

	return {
		activeTodos,
		completedTodos,
		...draggable,
		...toggle,
	};
}
