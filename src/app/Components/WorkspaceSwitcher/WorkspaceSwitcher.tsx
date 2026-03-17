"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { WORKSPACE_GRADIENTS } from "@/lib/workspaceGradients";
import { WorkspaceManagerDialog, WorkspaceManagerPanel } from "@components/WorkspaceSwitcher/WorkspaceManagerDialog";
import { WorkspaceSwitcherTrigger } from "@components/WorkspaceSwitcher/WorkspaceSwitcherTrigger";
import clsx from "clsx";
import { FormEvent, useState } from "react";
import dialogStyles from "./WorkspaceManagerDialog.module.scss";
import styles from "./WorkspaceSwitcher.module.scss";

type WorkspaceSwitcherProps = {
	compact?: boolean;
	variant?: "default" | "sidebar" | "chip" | "tab" | "nav";
};

type WorkspacePanelProps = {
	className?: string;
};

function getWorkspaceInitials(label: string) {
	return label
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("") || "P";
}

function useWorkspaceManagerController() {
	const {
		workspaces,
		activeWorkspaceId,
		isLoading,
		isSaving,
		error,
		switchWorkspace,
		prefetchWorkspace,
		createWorkspaceAction,
		renameWorkspaceAction,
		deleteWorkspaceAction,
	} = useWorkspace();

	const [newWorkspaceName, setNewWorkspaceName] = useState("");
	const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");
	const [deleteWorkspaceTarget, setDeleteWorkspaceTarget] = useState<{ id: string; name: string } | null>(null);
	const [deleteWorkspaceConfirmation, setDeleteWorkspaceConfirmation] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);
	const [switchingWorkspaceId, setSwitchingWorkspaceId] = useState<string | null>(null);

	const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
	const activeLabel = activeWorkspace?.name ?? "Personal";
	const activeGradientPreset = activeWorkspace?.gradientPreset ?? "violet";
	const activeGradient = WORKSPACE_GRADIENTS[activeGradientPreset];
	const activeInitials = getWorkspaceInitials(activeLabel);

	const onCreateWorkspace = async (event: FormEvent) => {
		event.preventDefault();
		setLocalError(null);
		const result = await createWorkspaceAction(newWorkspaceName);
		if (!result.success) {
			setLocalError(result.error ?? "Failed to create workspace");
			return;
		}
		setNewWorkspaceName("");
	};

	const onQuickSwitchWorkspace = async (workspaceId: string) => {
		setLocalError(null);
		setSwitchingWorkspaceId(workspaceId);
		const result = await switchWorkspace(workspaceId);
		setSwitchingWorkspaceId(null);
		if (!result.success) {
			setLocalError(result.error ?? "Failed to switch workspace");
		}
	};

	const startEditingWorkspace = (workspaceId: string, name: string) => {
		setEditingWorkspaceId(workspaceId);
		setEditingName(name);
	};

	const onSaveRename = async () => {
		if (!editingWorkspaceId) return;
		setLocalError(null);
		const result = await renameWorkspaceAction(editingWorkspaceId, editingName);
		if (!result.success) {
			setLocalError(result.error ?? "Failed to rename workspace");
			return;
		}
		setEditingWorkspaceId(null);
		setEditingName("");
	};

	const onDeleteWorkspace = async () => {
		if (!deleteWorkspaceTarget) return;
		setLocalError(null);
		if (deleteWorkspaceConfirmation.trim() !== deleteWorkspaceTarget.name.trim()) {
			setLocalError("Type the workspace name exactly to confirm deletion");
			return;
		}
		const result = await deleteWorkspaceAction(deleteWorkspaceTarget.id);
		if (!result.success) {
			setLocalError(result.error ?? "Failed to delete workspace");
			return;
		}
		setDeleteWorkspaceTarget(null);
		setDeleteWorkspaceConfirmation("");
	};

	const managerProps = {
		workspaces,
		activeWorkspaceId,
		isSaving,
		localError,
		error,
		newWorkspaceName,
		editingWorkspaceId,
		editingName,
		deleteWorkspaceTarget,
		deleteWorkspaceConfirmation,
		switchingWorkspaceId,
		onNewWorkspaceNameChange: setNewWorkspaceName,
		onEditingNameChange: setEditingName,
		onDeleteWorkspaceConfirmationChange: setDeleteWorkspaceConfirmation,
		onCreateWorkspace,
		onQuickSwitchWorkspace: (workspaceId: string) => {
			void onQuickSwitchWorkspace(workspaceId);
		},
		onPrefetchWorkspace: (workspaceId: string) => {
			void prefetchWorkspace(workspaceId);
		},
		onStartEditingWorkspace: startEditingWorkspace,
		onSaveRename: () => {
			void onSaveRename();
		},
		onCancelEditing: () => {
			setEditingWorkspaceId(null);
			setEditingName("");
		},
		onRequestDelete: (workspaceId: string, name: string) => {
			setEditingWorkspaceId(null);
			setEditingName("");
			setDeleteWorkspaceTarget({ id: workspaceId, name });
			setDeleteWorkspaceConfirmation("");
			setLocalError(null);
		},
		onCancelDelete: () => {
			setDeleteWorkspaceTarget(null);
			setDeleteWorkspaceConfirmation("");
			setLocalError(null);
		},
		onConfirmDelete: () => {
			void onDeleteWorkspace();
		},
	};

	return {
		activeWorkspaceId,
		activeLabel,
		activeInitials,
		activeGradient,
		error,
		isLoading,
		isSaving,
		managerProps,
		switchWorkspace,
		workspaces,
	};
}

export function WorkspacePanel({ className }: WorkspacePanelProps) {
	const { managerProps } = useWorkspaceManagerController();

	return (
		<div className={styles["workspace-switcher-wrapper"]}>
			<WorkspaceManagerPanel
				{...managerProps}
				className={clsx(dialogStyles["manage-panel--embedded"], className)}
			/>
		</div>
	);
}

export function WorkspaceSwitcher({ compact = false, variant = "default" }: WorkspaceSwitcherProps) {
	const {
		activeWorkspaceId,
		activeLabel,
		activeInitials,
		activeGradient,
		isLoading,
		isSaving,
		managerProps,
		switchWorkspace,
		workspaces,
	} = useWorkspaceManagerController();
	const [isManageOpen, setIsManageOpen] = useState(false);

	const handleManageOpenChange = (open: boolean) => {
		setIsManageOpen(open);
	};

	return (
		<div className={styles["workspace-switcher-wrapper"]}>
			<WorkspaceSwitcherTrigger
				compact={compact}
				variant={variant}
				workspaces={workspaces}
				activeWorkspaceId={activeWorkspaceId}
				activeLabel={activeLabel}
				activeInitials={activeInitials}
				activeGradient={activeGradient}
				isLoading={isLoading}
				isSaving={isSaving}
				isManageOpen={isManageOpen}
				onOpenManage={handleManageOpenChange}
				onSwitchWorkspace={(workspaceId) => {
					void switchWorkspace(workspaceId);
				}}
				manageContent={
					<WorkspaceManagerDialog
						{...managerProps}
					/>
				}
			/>
		</div>
	);
}
