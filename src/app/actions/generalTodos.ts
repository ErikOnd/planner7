"use server";

import prisma from "@/lib/prisma";
import { withWorkspace } from "@/lib/serverActionContext";

export type FormState = {
	message?: string;
	error?: string;
	success?: boolean;
};

export async function saveGeneralTodo(_prevState: FormState, formData: FormData): Promise<FormState> {
	const todoId = formData.get("todoId") as string;
	if (todoId && todoId.trim().length > 0) {
		return updateGeneralTodo(_prevState, formData);
	}
	return createGeneralTodo(_prevState, formData);
}

async function createGeneralTodo(_prevState: FormState, formData: FormData): Promise<FormState> {
	const text = formData.get("text") as string;
	if (!text || text.trim().length === 0) {
		return {
			error: "Task text is required",
			success: false,
		};
	}

	return withWorkspace<FormState>({
		run: async (context) => {
			const maxOrder = await prisma.generalTodo.findFirst({
				where: {
					userId: context.userId,
					workspaceId: context.activeWorkspaceId,
				},
				orderBy: { order: "desc" },
				select: { order: true },
			});

			await prisma.generalTodo.create({
				data: {
					userId: context.userId,
					workspaceId: context.activeWorkspaceId,
					text: text.trim(),
					order: (maxOrder?.order ?? -1) + 1,
				},
			});

			return {
				message: "Task created successfully",
				success: true,
			};
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error creating general todo:", error);
			return {
				error: "Failed to create task",
				success: false,
			};
		},
	});
}

export async function getGeneralTodos() {
	return withWorkspace({
		run: async (context) => {
			return await prisma.generalTodo.findMany({
				where: {
					userId: context.userId,
					workspaceId: context.activeWorkspaceId,
				},
				orderBy: { order: "asc" },
			});
		},
		onAuthError: () => [],
		onError: (error) => {
			console.error("Error fetching general todos:", error);
			return [];
		},
	});
}

export async function updateGeneralTodoCompletion(todoId: string, completed: boolean): Promise<FormState> {
	return withWorkspace<FormState>({
		run: async (context) => {
			await prisma.generalTodo.updateMany({
				where: {
					id: todoId,
					userId: context.userId,
					workspaceId: context.activeWorkspaceId,
				},
				data: {
					completed,
					completedAt: completed ? new Date() : null,
				},
			});

			return {
				message: "Task updated successfully",
				success: true,
			};
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error updating todo completion:", error);
			return {
				error: "Failed to update task",
				success: false,
			};
		},
	});
}

export async function deleteGeneralTodo(todoId: string): Promise<FormState> {
	return withWorkspace<FormState>({
		run: async (context) => {
			await prisma.generalTodo.deleteMany({
				where: {
					id: todoId,
					userId: context.userId,
					workspaceId: context.activeWorkspaceId,
				},
			});

			return {
				message: "Task deleted successfully",
				success: true,
			};
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error deleting general todo:", error);
			return {
				error: "Failed to delete task",
				success: false,
			};
		},
	});
}

async function updateGeneralTodo(_prevState: FormState, formData: FormData): Promise<FormState> {
	const todoId = formData.get("todoId") as string;
	const text = formData.get("text") as string;

	if (!todoId) {
		return {
			error: "Task ID is required",
			success: false,
		};
	}

	if (!text || text.trim().length === 0) {
		return {
			error: "Task text is required",
			success: false,
		};
	}

	return withWorkspace<FormState>({
		run: async (context) => {
			await prisma.generalTodo.updateMany({
				where: {
					id: todoId,
					userId: context.userId,
					workspaceId: context.activeWorkspaceId,
				},
				data: {
					text: text.trim(),
				},
			});

			return {
				message: "Task updated successfully",
				success: true,
			};
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error updating general todo:", error);
			return {
				error: "Failed to update task",
				success: false,
			};
		},
	});
}

export async function reorderGeneralTodos(todoIds: string[]): Promise<FormState> {
	return withWorkspace<FormState>({
		run: async (context) => {
			await prisma.$transaction(
				todoIds.map((id, index) =>
					prisma.generalTodo.updateMany({
						where: {
							id,
							userId: context.userId,
							workspaceId: context.activeWorkspaceId,
						},
						data: {
							order: index,
						},
					}),
			),
			);

			return {
				message: "Tasks reordered successfully",
				success: true,
			};
		},
		onAuthError: (error) => ({ success: false, error }),
		onError: (error) => {
			console.error("Error reordering general todos:", error);
			return {
				error: "Failed to reorder tasks",
				success: false,
			};
		},
	});
}
