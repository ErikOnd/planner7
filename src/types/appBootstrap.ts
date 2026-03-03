import type { WorkspaceGradientPreset } from "@/lib/workspaceGradients";
import type { NoteContent } from "types/noteContent";

export type BootstrapWorkspace = {
	id: string;
	name: string;
	gradientPreset: WorkspaceGradientPreset;
	createdAt: string;
	updatedAt: string;
};

export type BootstrapProfile = {
	email: string;
	displayName: string;
	showWeekends: boolean;
	showEditorToolbar: boolean;
};

export type BootstrapDailyNote = {
	date: string;
	content: NoteContent | undefined;
};

export type BootstrapTodo = {
	id: string;
	userId: string;
	workspaceId: string;
	text: string;
	completed: boolean;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
	order: number;
};

export type AppBootstrapPayload = {
	profile: BootstrapProfile;
	activeWorkspaceId: string;
	workspaces: BootstrapWorkspace[];
	notes: BootstrapDailyNote[];
	todos: BootstrapTodo[];
};

export type WeekNotesPayload = {
	notes: BootstrapDailyNote[];
};

export type WorkspaceTodosPayload = {
	todos: BootstrapTodo[];
};
