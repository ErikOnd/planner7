"use client";

import { DragEndEvent, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { GeneralTodo } from "@prisma/client";
import { useEffect, useState } from "react";
import { reorderGeneralTodos } from "../app/actions/generalTodos";

export function useDraggableTodos(todos: GeneralTodo[]) {
	const [localTodos, setLocalTodos] = useState(todos);
	const [activeTodoId, setActiveTodoId] = useState<string | null>(null);

	useEffect(() => {
		setLocalTodos(todos);
	}, [todos]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveTodoId(event.active.id as string);
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		setActiveTodoId(null);

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = localTodos.findIndex(todo => todo.id === active.id);
		const newIndex = localTodos.findIndex(todo => todo.id === over.id);

		const reorderedTodos = arrayMove(localTodos, oldIndex, newIndex);
		setLocalTodos(reorderedTodos);

		const todoIds = reorderedTodos.map(todo => todo.id);
		await reorderGeneralTodos(todoIds);
	};

	const handleDragCancel = () => {
		setActiveTodoId(null);
	};

	const activeTodo = localTodos.find(todo => todo.id === activeTodoId);

	return {
		localTodos,
		activeTodo,
		sensors,
		handleDragStart,
		handleDragEnd,
		handleDragCancel,
	};
}
