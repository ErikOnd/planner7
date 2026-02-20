"use client";

import type { WorkspaceGradientPreset } from "@/lib/workspaceGradients";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
	createWorkspace,
	deleteWorkspace,
	getWorkspaces,
	renameWorkspace,
	setActiveWorkspace,
	updateWorkspaceGradient,
	type WorkspaceSummary,
} from "../app/actions/workspaces";

type WorkspaceContextValue = {
	workspaces: WorkspaceSummary[];
	activeWorkspaceId: string | null;
	activeWorkspaceName: string | null;
	isLoading: boolean;
	isSaving: boolean;
	error: string | null;
	refreshWorkspaces: () => Promise<void>;
	switchWorkspace: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;
	createWorkspaceAction: (
		name: string,
		gradientPreset: WorkspaceGradientPreset,
	) => Promise<{ success: boolean; error?: string }>;
	renameWorkspaceAction: (workspaceId: string, name: string) => Promise<{ success: boolean; error?: string }>;
	updateWorkspaceGradientAction: (
		workspaceId: string,
		gradientPreset: WorkspaceGradientPreset,
	) => Promise<{ success: boolean; error?: string }>;
	deleteWorkspaceAction: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
	const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
	const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const refreshWorkspaces = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await getWorkspaces();
			setWorkspaces(data.workspaces);
			setActiveWorkspaceId(data.activeWorkspaceId);
		} catch (fetchError) {
			setError("Failed to load workspaces");
			console.error("Error loading workspaces:", fetchError);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void refreshWorkspaces();
	}, [refreshWorkspaces]);

	const switchWorkspace = useCallback(async (workspaceId: string) => {
		setIsSaving(true);
		setError(null);
		const previous = activeWorkspaceId;
		setActiveWorkspaceId(workspaceId);

		try {
			const result = await setActiveWorkspace(workspaceId);
			if (!result.success) {
				setActiveWorkspaceId(previous);
				setError(result.error ?? "Failed to switch workspace");
			}
			return result;
		} catch (switchError) {
			setActiveWorkspaceId(previous);
			setError("Failed to switch workspace");
			console.error("Error switching workspace:", switchError);
			return { success: false, error: "Failed to switch workspace" };
		} finally {
			setIsSaving(false);
		}
	}, [activeWorkspaceId]);

	const createWorkspaceAction = useCallback(async (name: string, gradientPreset: WorkspaceGradientPreset) => {
		setIsSaving(true);
		setError(null);
		try {
			const result = await createWorkspace(name, gradientPreset);
			if (!result.success) {
				setError(result.error ?? "Failed to create workspace");
				return result;
			}
			await refreshWorkspaces();
			return result;
		} catch (createError) {
			setError("Failed to create workspace");
			console.error("Error creating workspace:", createError);
			return { success: false, error: "Failed to create workspace" };
		} finally {
			setIsSaving(false);
		}
	}, [refreshWorkspaces]);

	const renameWorkspaceAction = useCallback(async (workspaceId: string, name: string) => {
		setIsSaving(true);
		setError(null);
		try {
			const result = await renameWorkspace(workspaceId, name);
			if (!result.success) {
				setError(result.error ?? "Failed to rename workspace");
				return result;
			}
			await refreshWorkspaces();
			return result;
		} catch (renameError) {
			setError("Failed to rename workspace");
			console.error("Error renaming workspace:", renameError);
			return { success: false, error: "Failed to rename workspace" };
		} finally {
			setIsSaving(false);
		}
	}, [refreshWorkspaces]);

	const updateWorkspaceGradientAction = useCallback(
		async (workspaceId: string, gradientPreset: WorkspaceGradientPreset) => {
			setIsSaving(true);
			setError(null);
			try {
				const result = await updateWorkspaceGradient(workspaceId, gradientPreset);
				if (!result.success) {
					setError(result.error ?? "Failed to update workspace gradient");
					return result;
				}
				await refreshWorkspaces();
				return result;
			} catch (gradientError) {
				setError("Failed to update workspace gradient");
				console.error("Error updating workspace gradient:", gradientError);
				return { success: false, error: "Failed to update workspace gradient" };
			} finally {
				setIsSaving(false);
			}
		},
		[refreshWorkspaces],
	);

	const deleteWorkspaceAction = useCallback(async (workspaceId: string) => {
		setIsSaving(true);
		setError(null);
		try {
			const result = await deleteWorkspace(workspaceId);
			if (!result.success) {
				setError(result.error ?? "Failed to delete workspace");
				return result;
			}
			await refreshWorkspaces();
			return result;
		} catch (deleteError) {
			setError("Failed to delete workspace");
			console.error("Error deleting workspace:", deleteError);
			return { success: false, error: "Failed to delete workspace" };
		} finally {
			setIsSaving(false);
		}
	}, [refreshWorkspaces]);

	const activeWorkspaceName = useMemo(() => {
		if (!activeWorkspaceId) return null;
		return workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.name ?? null;
	}, [activeWorkspaceId, workspaces]);

	return (
		<WorkspaceContext.Provider
			value={{
				workspaces,
				activeWorkspaceId,
				activeWorkspaceName,
				isLoading,
				isSaving,
				error,
				refreshWorkspaces,
				switchWorkspace,
				createWorkspaceAction,
				renameWorkspaceAction,
				updateWorkspaceGradientAction,
				deleteWorkspaceAction,
			}}
		>
			{children}
		</WorkspaceContext.Provider>
	);
}

export function useWorkspace() {
	const context = useContext(WorkspaceContext);
	if (!context) {
		throw new Error("useWorkspace must be used within a WorkspaceProvider");
	}
	return context;
}
