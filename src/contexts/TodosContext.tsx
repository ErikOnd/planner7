"use client";

import type { GeneralTodo } from "@prisma/client";
import { createContext, useCallback, useEffect, useState, ReactNode } from "react";
import { getGeneralTodos, deleteGeneralTodo as deleteGeneralTodoAction } from "../app/actions/generalTodos";

type TodosContextType = {
	todos: GeneralTodo[];
	loading: boolean;
	error: string | null;
	addTodoOptimistic: (todo: GeneralTodo) => void;
	updateTodoOptimistic: (todo: GeneralTodo) => void;
	deleteTodoOptimistic: (todoId: string) => Promise<void>;
	reorderTodosOptimistic: (reorderedTodos: GeneralTodo[]) => void;
};

const TodosContext = createContext<TodosContextType | undefined>(undefined);

export function TodosProvider({ children }: { children: ReactNode }) {
	const [todos, setTodos] = useState<GeneralTodo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch todos only once on initial mount
	useEffect(() => {
		const fetchTodos = async () => {
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
		};

		fetchTodos();
	}, []);

	const addTodoOptimistic = useCallback((newTodo: GeneralTodo) => {
		setTodos(prev => [...prev, newTodo]);
	}, []);

	const updateTodoOptimistic = useCallback((updatedTodo: GeneralTodo) => {
		setTodos(prev => prev.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo));
	}, []);

	const deleteTodoOptimistic = useCallback(async (todoId: string) => {
		setTodos(prev => prev.filter(todo => todo.id !== todoId));

		try {
			await deleteGeneralTodoAction(todoId);
		} catch (deleteError) {
			console.error("Error deleting todo:", deleteError);
			try {
				const data = await getGeneralTodos();
				setTodos(data);
			} catch (fetchError) {
				setError("Failed to restore todos after delete error");
			}
		}
	}, []);

	const reorderTodosOptimistic = useCallback((reorderedTodos: GeneralTodo[]) => {
		setTodos(reorderedTodos);
	}, []);

	return (
		<TodosContext.Provider
			value={{
				todos,
				loading,
				error,
				addTodoOptimistic,
				updateTodoOptimistic,
				deleteTodoOptimistic,
				reorderTodosOptimistic,
			}}
		>
			{children}
		</TodosContext.Provider>
	);
}
