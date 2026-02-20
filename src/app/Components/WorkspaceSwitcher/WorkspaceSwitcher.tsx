"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { WORKSPACE_GRADIENTS, type WorkspaceGradientPreset } from "@/lib/workspaceGradients";
import { DeleteTodoDialog } from "@components/DeleteTodoDialog/DeleteTodoDialog";
import { WorkspaceManagerDialog } from "@components/WorkspaceSwitcher/WorkspaceManagerDialog";
import { WorkspaceSwitcherTrigger } from "@components/WorkspaceSwitcher/WorkspaceSwitcherTrigger";
import { FormEvent, useState } from "react";
import styles from "./WorkspaceSwitcher.module.scss";

type WorkspaceSwitcherProps = {
	compact?: boolean;
	variant?: "default" | "sidebar" | "chip" | "tab";
};

const gradientPresets = Object.entries(WORKSPACE_GRADIENTS) as [
	WorkspaceGradientPreset,
	{ from: string; to: string },
][];

export function WorkspaceSwitcher({ compact = false, variant = "default" }: WorkspaceSwitcherProps) {
	const {
		workspaces,
		activeWorkspaceId,
		isLoading,
		isSaving,
		error,
		switchWorkspace,
		createWorkspaceAction,
		renameWorkspaceAction,
		updateWorkspaceGradientAction,
		deleteWorkspaceAction,
	} = useWorkspace();

	const [isManageOpen, setIsManageOpen] = useState(false);
	const [newWorkspaceName, setNewWorkspaceName] = useState("");
	const [newWorkspaceGradient, setNewWorkspaceGradient] = useState<WorkspaceGradientPreset>("violet");
	const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");
	const [editingGradient, setEditingGradient] = useState<WorkspaceGradientPreset>("violet");
	const [deleteWorkspaceTarget, setDeleteWorkspaceTarget] = useState<{ id: string; name: string } | null>(null);
	const [localError, setLocalError] = useState<string | null>(null);

	const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
	const activeLabel = activeWorkspace?.name ?? "Personal";
	const activeGradientPreset = activeWorkspace?.gradientPreset ?? "violet";
	const activeGradient = WORKSPACE_GRADIENTS[activeGradientPreset];
	const activeInitials = activeLabel
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("") || "P";

	const onCreateWorkspace = async (event: FormEvent) => {
		event.preventDefault();
		setLocalError(null);
		const result = await createWorkspaceAction(newWorkspaceName, newWorkspaceGradient);
		if (!result.success) {
			setLocalError(result.error ?? "Failed to create workspace");
			return;
		}
		setNewWorkspaceName("");
	};

	const onQuickSwitchWorkspace = async (workspaceId: string) => {
		setLocalError(null);
		const result = await switchWorkspace(workspaceId);
		if (!result.success) {
			setLocalError(result.error ?? "Failed to switch workspace");
			return;
		}
		setIsManageOpen(false);
	};

	const startEditingWorkspace = (workspaceId: string, name: string) => {
		setEditingWorkspaceId(workspaceId);
		setEditingName(name);
		const workspace = workspaces.find((item) => item.id === workspaceId);
		setEditingGradient(workspace?.gradientPreset ?? "violet");
	};

	const onSaveRename = async () => {
		if (!editingWorkspaceId) return;
		setLocalError(null);
		const result = await renameWorkspaceAction(editingWorkspaceId, editingName);
		if (!result.success) {
			setLocalError(result.error ?? "Failed to rename workspace");
			return;
		}
		const gradientResult = await updateWorkspaceGradientAction(editingWorkspaceId, editingGradient);
		if (!gradientResult.success) {
			setLocalError(gradientResult.error ?? "Failed to update workspace gradient");
			return;
		}
		setEditingWorkspaceId(null);
		setEditingName("");
	};

	const onDeleteWorkspace = async () => {
		if (!deleteWorkspaceTarget) return;
		setLocalError(null);
		const result = await deleteWorkspaceAction(deleteWorkspaceTarget.id);
		if (!result.success) {
			setLocalError(result.error ?? "Failed to delete workspace");
			return;
		}
		setDeleteWorkspaceTarget(null);
	};

	return (
		<>
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
					onOpenManage={setIsManageOpen}
					onSwitchWorkspace={(workspaceId) => {
						void switchWorkspace(workspaceId);
					}}
					manageContent={
						<WorkspaceManagerDialog
							workspaces={workspaces}
							activeWorkspaceId={activeWorkspaceId}
							isSaving={isSaving}
							localError={localError}
							error={error}
							gradientPresets={gradientPresets}
							newWorkspaceName={newWorkspaceName}
							newWorkspaceGradient={newWorkspaceGradient}
							editingWorkspaceId={editingWorkspaceId}
							editingName={editingName}
							editingGradient={editingGradient}
							onNewWorkspaceNameChange={setNewWorkspaceName}
							onNewWorkspaceGradientChange={setNewWorkspaceGradient}
							onEditingNameChange={setEditingName}
							onEditingGradientChange={setEditingGradient}
							onCreateWorkspace={onCreateWorkspace}
							onQuickSwitchWorkspace={(workspaceId) => {
								void onQuickSwitchWorkspace(workspaceId);
							}}
							onStartEditingWorkspace={startEditingWorkspace}
							onSaveRename={() => {
								void onSaveRename();
							}}
							onCancelEditing={() => {
								setEditingWorkspaceId(null);
								setEditingName("");
								setEditingGradient("violet");
							}}
							onRequestDelete={(workspaceId, name) => {
								setDeleteWorkspaceTarget({ id: workspaceId, name });
							}}
						/>
					}
				/>
			</div>
			<DeleteTodoDialog
				open={Boolean(deleteWorkspaceTarget)}
				onOpenChange={(open) => {
					if (!open) setDeleteWorkspaceTarget(null);
				}}
				onConfirm={() => {
					void onDeleteWorkspace();
				}}
				title="Delete workspace?"
				description={deleteWorkspaceTarget
					? `Delete "${deleteWorkspaceTarget.name}" permanently? This can't be recovered.`
					: "This action can't be recovered."}
				confirmLabel="Delete workspace"
			/>
		</>
	);
}
