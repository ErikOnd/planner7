import type { GeneralTodo } from "@prisma/client";

export type TodosState = {
	todos: GeneralTodo[];
	remindersByText: Map<string, Date>;
	loading: boolean;
	error: string | null;
	deleteTodo: (todoId: string) => Promise<void>;
	addTodo: (todo: GeneralTodo) => void;
	updateTodo: (todoId: string, text: string) => void;
	removeTodoReminder: (todoId: string, text: string) => Promise<void>;
	updateTodoCompletion: (todoId: string, completed: boolean) => Promise<void>;
	refresh: () => Promise<void>;
	silentRefresh: () => Promise<void>;
};
