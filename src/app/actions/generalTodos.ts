"use server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type FormState = {
	message?: string;
	error?: string;
	success?: boolean;
};

export async function saveGeneralTodo(_prevState: FormState, formData: FormData): Promise<FormState> {
	const todoId = formData.get("todoId") as string;

	if (todoId && todoId.trim().length > 0) {
		return updateGeneralTodo(_prevState, formData);
	} else {
		return createGeneralTodo(_prevState, formData);
	}
}

export async function createGeneralTodo(_prevState: FormState, formData: FormData): Promise<FormState> {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return {
				error: authResult.error,
				success: false,
			};
		}

		const text = formData.get("text") as string;

		if (!text || text.trim().length === 0) {
			return {
				error: "Task text is required",
				success: false,
			};
		}

		const maxOrder = await prisma.generalTodo.findFirst({
			where: { userId: authResult.userId },
			orderBy: { order: "desc" },
			select: { order: true },
		});

		await prisma.generalTodo.create({
			data: {
				userId: authResult.userId,
				text: text.trim(),
				order: (maxOrder?.order ?? -1) + 1,
			},
		});

		revalidatePath("/");

		return {
			message: "Task created successfully",
			success: true,
		};
	} catch (error) {
		console.error("Error creating general todo:", error);
		return {
			error: "Failed to create task",
			success: false,
		};
	}
}

export async function getGeneralTodos() {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return [];
		}

		const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		await prisma.generalTodo.deleteMany({
			where: {
				userId: authResult.userId,
				completed: true,
				completedAt: { lt: cutoff },
			},
		});

		return await prisma.generalTodo.findMany({
			where: { userId: authResult.userId },
			orderBy: { order: "asc" },
		});
	} catch (error) {
		console.error("Error fetching general todos:", error);
		return [];
	}
}

export async function updateGeneralTodoCompletion(todoId: string, completed: boolean): Promise<FormState> {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return {
				error: authResult.error,
				success: false,
			};
		}

		await prisma.generalTodo.updateMany({
			where: {
				id: todoId,
				userId: authResult.userId,
			},
			data: {
				completed,
				completedAt: completed ? new Date() : null,
			},
		});

		revalidatePath("/");

		return {
			message: "Task updated successfully",
			success: true,
		};
	} catch (error) {
		console.error("Error updating todo completion:", error);
		return {
			error: "Failed to update task",
			success: false,
		};
	}
}

export async function deleteGeneralTodo(todoId: string): Promise<FormState> {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return {
				error: authResult.error,
				success: false,
			};
		}

		await prisma.generalTodo.deleteMany({
			where: {
				id: todoId,
				userId: authResult.userId,
			},
		});

		revalidatePath("/");

		return {
			message: "Task deleted successfully",
			success: true,
		};
	} catch (error) {
		console.error("Error deleting general todo:", error);
		return {
			error: "Failed to delete task",
			success: false,
		};
	}
}

export async function updateGeneralTodo(_prevState: FormState, formData: FormData): Promise<FormState> {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return {
				error: authResult.error,
				success: false,
			};
		}

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

		await prisma.generalTodo.updateMany({
			where: {
				id: todoId,
				userId: authResult.userId,
			},
			data: {
				text: text.trim(),
			},
		});

		revalidatePath("/");

		return {
			message: "Task updated successfully",
			success: true,
		};
	} catch (error) {
		console.error("Error updating general todo:", error);
		return {
			error: "Failed to update task",
			success: false,
		};
	}
}

export async function reorderGeneralTodos(todoIds: string[]): Promise<FormState> {
	try {
		const authResult = await getCurrentUser();
		if (!authResult.success) {
			return {
				error: authResult.error,
				success: false,
			};
		}

		await prisma.$transaction(
			todoIds.map((id, index) =>
				prisma.generalTodo.updateMany({
					where: {
						id,
						userId: authResult.userId,
					},
					data: {
						order: index,
					},
				})
			),
		);

		revalidatePath("/");

		return {
			message: "Tasks reordered successfully",
			success: true,
		};
	} catch (error) {
		console.error("Error reordering general todos:", error);
		return {
			error: "Failed to reorder tasks",
			success: false,
		};
	}
}
