"use server";

import { getCurrentUser } from "@/lib/auth";
import { ensureWorkspaceSession } from "@/lib/workspaces";

type ErrorResult = {
	success: false;
	error: string;
};

type UserResult = {
	success: true;
	userId: string;
};

type WorkspaceResult = {
	success: true;
	userId: string;
	activeWorkspaceId: string;
};

type UserContext = {
	userId: string;
};

type WorkspaceContext = {
	userId: string;
	activeWorkspaceId: string;
};

export async function requireUserContext(): Promise<UserResult | ErrorResult> {
	const authResult = await getCurrentUser();
	if (!authResult.success) {
		return {
			success: false,
			error: authResult.error,
		};
	}

	return {
		success: true,
		userId: authResult.userId,
	};
}

export async function requireWorkspaceContext(): Promise<WorkspaceResult | ErrorResult> {
	const userContext = await requireUserContext();
	if (!userContext.success) {
		return userContext;
	}

	const session = await ensureWorkspaceSession(userContext.userId);
	return {
		success: true,
		userId: session.userId,
		activeWorkspaceId: session.activeWorkspaceId,
	};
}

type WrapperArgs<TContext, TReturn> = {
	run: (context: TContext) => Promise<TReturn>;
	onAuthError: (error: string) => TReturn;
	onError: (error: unknown) => TReturn;
};

export async function withUser<TReturn>(args: WrapperArgs<UserContext, TReturn>): Promise<TReturn> {
	try {
		const context = await requireUserContext();
		if (!context.success) {
			return args.onAuthError(context.error);
		}
		return await args.run({ userId: context.userId });
	} catch (error) {
		return args.onError(error);
	}
}

export async function withWorkspace<TReturn>(args: WrapperArgs<WorkspaceContext, TReturn>): Promise<TReturn> {
	try {
		const context = await requireWorkspaceContext();
		if (!context.success) {
			return args.onAuthError(context.error);
		}
		return await args.run({
			userId: context.userId,
			activeWorkspaceId: context.activeWorkspaceId,
		});
	} catch (error) {
		return args.onError(error);
	}
}
