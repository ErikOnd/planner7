import { useCallback, useEffect, useRef, useState } from "react";

const DELETE_DELAY = 5000;

export function useTodoToggle(
	updateTodoCompletion: (todoId: string, completed: boolean) => Promise<void>,
	resetKey?: string | null,
) {
	const [checkedTodos, setCheckedTodos] = useState<Set<string>>(new Set());
	const deletionTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

	const handleTodoToggle = useCallback((todoId: string, checked: boolean) => {
		const existingTimeout = deletionTimeoutsRef.current.get(todoId);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
			deletionTimeoutsRef.current.delete(todoId);
		}

		setCheckedTodos(prev => {
			const next = new Set(prev);
			if (checked) {
				next.add(todoId);
			} else {
				next.delete(todoId);
			}
			return next;
		});

		if (checked) {
			const timeoutId = setTimeout(() => {
				updateTodoCompletion(todoId, true);
				deletionTimeoutsRef.current.delete(todoId);
				setCheckedTodos(prev => {
					const next = new Set(prev);
					next.delete(todoId);
					return next;
				});
			}, DELETE_DELAY);

			deletionTimeoutsRef.current.set(todoId, timeoutId);
		} else {
			updateTodoCompletion(todoId, false);
		}
	}, [updateTodoCompletion]);

	useEffect(() => {
		const timeouts = deletionTimeoutsRef.current;
		return () => {
			timeouts.forEach(clearTimeout);
			timeouts.clear();
		};
	}, []);

	useEffect(() => {
		const timeouts = deletionTimeoutsRef.current;
		timeouts.forEach(clearTimeout);
		timeouts.clear();
		setCheckedTodos(new Set());
	}, [resetKey]);

	return {
		checkedTodos,
		handleTodoToggle,
	};
}
