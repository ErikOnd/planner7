"use server";

import prisma from "@/lib/prisma";
import { withWorkspace } from "@/lib/serverActionContext";
import { Prisma } from "@prisma/client";

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
			// Serializable transaction prevents duplicate order values under concurrent creates.
			await prisma.$transaction(
				async (tx) => {
					const maxOrder = await tx.generalTodo.findFirst({
						where: {
							userId: context.userId,
							workspaceId: context.activeWorkspaceId,
						},
						orderBy: { order: "desc" },
						select: { order: true },
					});

					await tx.generalTodo.create({
						data: {
							userId: context.userId,
							workspaceId: context.activeWorkspaceId,
							text: text.trim(),
							order: (maxOrder?.order ?? -1) + 1,
						},
					});
				},
				{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
			);

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
			if (todoIds.length === 0) {
				return { message: "Tasks reordered successfully", success: true };
			}

			// Single UPDATE with CASE expression — replaces N individual updates.
			// Parameterised via $executeRawUnsafe: only indices are interpolated
			// into the SQL string; all values use $N placeholders.
			const orderCases = todoIds
				.map((_, i) => `WHEN id = $${i + 1}::uuid THEN ${i}`)
				.join("\n\t\t\t\t");

			const idParams = todoIds
				.map((_, i) => `$${i + 1}::uuid`)
				.join(", ");

			const userIdIdx = todoIds.length + 1;
			const workspaceIdIdx = todoIds.length + 2;

			await prisma.$executeRawUnsafe(
				`UPDATE "GeneralTodo"
				SET "order" = CASE id
					${orderCases}
					ELSE "order"
				END
				WHERE id = ANY(ARRAY[${idParams}])
					AND "userId" = $${userIdIdx}::uuid
					AND "workspaceId" = $${workspaceIdIdx}::uuid`,
				...todoIds,
				context.userId,
				context.activeWorkspaceId,
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
