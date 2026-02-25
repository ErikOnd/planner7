"use client";

import { useGeneralTodos } from "@hooks/useGeneralTodos";
import { createContext, ReactNode, useContext } from "react";
import type { TodosState } from "types/todosState";

const BacklogContext = createContext<TodosState | undefined>(undefined);

export function BacklogProvider({ children }: { children: ReactNode }) {
	const todosState = useGeneralTodos();
	return <BacklogContext.Provider value={todosState}>{children}</BacklogContext.Provider>;
}

export function useBacklog() {
	const context = useContext(BacklogContext);
	if (!context) {
		throw new Error("useBacklog must be used within a BacklogProvider");
	}
	return context;
}
