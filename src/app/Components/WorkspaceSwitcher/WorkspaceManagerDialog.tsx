"use client";

import { Button } from "@atoms/Button/Button";
import { Text } from "@atoms/Text/Text";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import type { WorkspaceSummary } from "../../actions/workspaces";
import styles from "./WorkspaceManagerDialog.module.scss";

type WorkspaceManagerSharedProps = {
	workspaces: WorkspaceSummary[];
	activeWorkspaceId: string | null;
	isSaving: boolean;
	localError: string | null;
	error: string | null;
	newWorkspaceName: string;
	editingWorkspaceId: string | null;
	editingName: string;
	deleteWorkspaceTarget: { id: string; name: string } | null;
	deleteWorkspaceConfirmation: string;
	switchingWorkspaceId: string | null;
	onNewWorkspaceNameChange: (value: string) => void;
	onEditingNameChange: (value: string) => void;
	onDeleteWorkspaceConfirmationChange: (value: string) => void;
	onCreateWorkspace: (event: FormEvent) => void;
	onQuickSwitchWorkspace: (workspaceId: string) => void;
	onPrefetchWorkspace: (workspaceId: string) => void;
	onStartEditingWorkspace: (workspaceId: string, name: string) => void;
	onSaveRename: () => void;
	onCancelEditing: () => void;
	onRequestDelete: (workspaceId: string, name: string) => void;
	onCancelDelete: () => void;
	onConfirmDelete: () => void;
};

type WorkspaceManagerPanelProps = WorkspaceManagerSharedProps & {
	className?: string;
	closeAction?: ReactNode;
};

function getWorkspaceInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("") || "W";
}

export function WorkspaceManagerPanel(props: WorkspaceManagerPanelProps) {
	const {
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
		onNewWorkspaceNameChange,
		onEditingNameChange,
		onDeleteWorkspaceConfirmationChange,
		onCreateWorkspace,
		onQuickSwitchWorkspace,
		onPrefetchWorkspace,
		onStartEditingWorkspace,
		onSaveRename,
		onCancelEditing,
		onRequestDelete,
		onCancelDelete,
		onConfirmDelete,
		className,
		closeAction,
	} = props;
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const activeWorkspace = useMemo(
		() => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0] ?? null,
		[activeWorkspaceId, workspaces],
	);
	const editingWorkspace = useMemo(
		() => workspaces.find((workspace) => workspace.id === editingWorkspaceId) ?? activeWorkspace,
		[activeWorkspace, editingWorkspaceId, workspaces],
	);
	const deleteWorkspace = useMemo(
		() =>
			deleteWorkspaceTarget
				? workspaces.find((workspace) => workspace.id === deleteWorkspaceTarget.id) ?? deleteWorkspaceTarget
				: null,
		[deleteWorkspaceTarget, workspaces],
	);

	const detailMode = deleteWorkspace ? "delete" : isCreateOpen ? "create" : editingWorkspaceId ? "edit" : "view";
	const detailWorkspace = deleteWorkspace ? deleteWorkspace : editingWorkspaceId ? editingWorkspace : activeWorkspace;
	const selectedWorkspaceId = deleteWorkspace?.id ?? editingWorkspaceId ?? activeWorkspaceId;
	const hasDetailPanel = detailMode !== "view";
	const detailName = detailMode === "create"
		? newWorkspaceName || "New Workspace"
		: detailMode === "edit"
		? editingName || editingWorkspace?.name || "Workspace"
		: detailWorkspace?.name || "Workspace";
	const detailInitials = getWorkspaceInitials(detailName);
	const isDeleteConfirmationValid = deleteWorkspace
		? deleteWorkspaceConfirmation.trim() === deleteWorkspace.name.trim()
		: false;

	const closeCreate = () => setIsCreateOpen(false);
	const openCreate = () => {
		setIsCreateOpen((current) => {
			const nextValue = !current;
			if (nextValue && editingWorkspaceId) {
				onCancelEditing();
			}
			if (nextValue && deleteWorkspace) {
				onCancelDelete();
			}
			return nextValue;
		});
	};

	return (
		<div className={clsx(styles["manage-panel"], className)}>
			<div className={styles["manage-header"]}>
				<div className={styles["manage-heading"]}>
					<h1 className={styles["manage-title"]}>Switch Workspace</h1>
					<Text size="sm" className={styles["manage-subtitle"]}>
						Manage your productivity environments
					</Text>
				</div>
				{closeAction}
			</div>

			<div
				className={clsx(
					styles["manage-body"],
					!hasDetailPanel && styles["manage-body--sidebar-only"],
				)}
			>
				<aside className={styles["workspace-sidebar"]}>
					<div className={styles["switch-list"]}>
						{workspaces.map((workspace) => {
							const isActive = workspace.id === activeWorkspaceId;
							const isSelected = workspace.id === selectedWorkspaceId;
							const isSwitching = workspace.id === switchingWorkspaceId;
							const isTapToSwitchState = !isSwitching && !isActive && !(isSelected && detailMode !== "view");
							const statusLabel = isSwitching
								? "Switching workspace..."
								: isActive
								? "Active workspace"
								: isSelected && detailMode !== "view"
								? detailMode === "delete"
									? "Selected workspace"
									: "Editing workspace"
								: "Tap to switch";

							return (
								<button
									key={workspace.id}
									type="button"
									className={clsx(styles["workspace-row"], isSelected && styles["workspace-row--active"])}
									onClick={() => {
										if (isSelected || isSaving || Boolean(switchingWorkspaceId)) return;
										onQuickSwitchWorkspace(workspace.id);
										setIsCreateOpen(false);
									}}
									disabled={isSaving || Boolean(switchingWorkspaceId)}
									onMouseEnter={() => {
										if (!isSelected) onPrefetchWorkspace(workspace.id);
									}}
									onFocus={() => {
										if (!isSelected) onPrefetchWorkspace(workspace.id);
									}}
								>
									<span className={styles["workspace-row-avatar"]}>{getWorkspaceInitials(workspace.name)}</span>
									<span className={styles["workspace-row-copy"]}>
										<span className={styles["workspace-row-title"]}>{workspace.name}</span>
										<span
											className={clsx(
												styles["workspace-row-status"],
												isTapToSwitchState && styles["workspace-row-status--tap"],
											)}
										>
											{statusLabel}
										</span>
									</span>
									<span
										className={clsx(
											styles["workspace-row-indicator"],
											isSelected && styles["workspace-row-indicator--active"],
											isSwitching && styles["workspace-row-indicator--loading"],
										)}
										aria-hidden
									>
										<span />
									</span>
								</button>
							);
						})}
					</div>

					<div className={styles["sidebar-footer"]}>
						<Button
							type="button"
							variant={isCreateOpen ? "secondary" : "primary"}
							size="lg"
							className={clsx(styles["new-workspace-button"], isCreateOpen && styles["new-workspace-button--active"])}
							onClick={openCreate}
						>
							{isCreateOpen ? "Hide New Workspace" : "New Workspace"}
						</Button>

						{detailMode === "view" && detailWorkspace && (
							<div className={styles["sidebar-action-row"]}>
								<Button
									type="button"
									variant="secondary"
									size="lg"
									className={styles["sidebar-action-button"]}
									onClick={() => {
										setIsCreateOpen(false);
										onStartEditingWorkspace(detailWorkspace.id, detailWorkspace.name);
									}}
									disabled={isSaving}
									icon="pencil"
								>
									Edit
								</Button>
								<Button
									type="button"
									variant="danger"
									size="lg"
									className={clsx(
										styles["sidebar-action-button"],
										styles["sidebar-action-button--danger"],
									)}
									onClick={() => onRequestDelete(detailWorkspace.id, detailWorkspace.name)}
									disabled={workspaces.length <= 1 || isSaving}
									icon="trash"
								>
									Delete
								</Button>
							</div>
						)}
					</div>
				</aside>

				{hasDetailPanel && (
					<section className={styles["workspace-detail-panel"]}>
						<div
							className={clsx(
								styles["workspace-detail-card"],
								(detailMode === "create" || detailMode === "edit") && styles["workspace-detail-card--form"],
								detailMode === "delete" && styles["workspace-detail-card--delete"],
							)}
						>
							{detailMode === "create" && (
								<form className={styles["workspace-form"]} onSubmit={onCreateWorkspace}>
									<div className={styles["workspace-detail-avatar"]}>{detailInitials}</div>
									<div className={styles["workspace-detail-copy"]}>
										<h2 className={styles["workspace-detail-title"]}>Create Workspace</h2>
										<Text size="sm" className={styles["workspace-detail-description"]}>
											Set up a new environment for projects, tasks, and notes.
										</Text>
									</div>

									<label className={styles["workspace-field"]}>
										<span className={styles["workspace-field-label"]}>Workspace name</span>
										<input
											type="text"
											value={newWorkspaceName}
											onChange={(event) => onNewWorkspaceNameChange(event.target.value)}
											className={styles["workspace-input"]}
											placeholder="New workspace name"
											maxLength={60}
										/>
									</label>

									<div className={styles["workspace-detail-actions"]}>
										<Button
											type="submit"
											variant="primary"
											size="lg"
											className={styles["detail-primary-action"]}
											disabled={isSaving}
										>
											Create Workspace
										</Button>
										<Button
											type="button"
											variant="secondary"
											size="lg"
											className={styles["detail-secondary-action"]}
											onClick={closeCreate}
										>
											Cancel
										</Button>
									</div>
								</form>
							)}

							{detailMode === "edit" && editingWorkspace && (
								<div className={styles["workspace-form"]}>
									<div className={styles["workspace-detail-avatar"]}>{detailInitials}</div>
									<div className={styles["workspace-detail-copy"]}>
										<h2 className={styles["workspace-detail-title"]}>Edit Workspace</h2>
										<Text size="sm" className={styles["workspace-detail-description"]}>
											Update the name and visual style for this workspace.
										</Text>
									</div>

									<label className={styles["workspace-field"]}>
										<span className={styles["workspace-field-label"]}>Workspace name</span>
										<input
											type="text"
											value={editingName}
											onChange={(event) => onEditingNameChange(event.target.value)}
											className={styles["workspace-input"]}
											maxLength={60}
										/>
									</label>

									<div className={styles["workspace-detail-actions"]}>
										<Button
											type="button"
											variant="primary"
											size="lg"
											className={styles["detail-primary-action"]}
											onClick={onSaveRename}
										>
											Save Changes
										</Button>
										<Button
											type="button"
											variant="secondary"
											size="lg"
											className={styles["detail-secondary-action"]}
											onClick={onCancelEditing}
										>
											Cancel
										</Button>
									</div>
								</div>
							)}

							{detailMode === "delete" && deleteWorkspace && (
								<div className={styles["workspace-delete-state"]}>
									<div className={styles["delete-warning-emblem"]} aria-hidden="true">
										<div className={styles["delete-warning-halo"]}>
											<div className={styles["delete-warning-triangle"]}>
												<span className={styles["delete-warning-mark"]}>!</span>
											</div>
										</div>
									</div>

									<div className={styles["workspace-delete-copy"]}>
										<h2 className={styles["workspace-delete-title"]}>Are you absolutely sure?</h2>
										<div className={styles["workspace-delete-alert"]}>
											This action <strong>cannot be undone.</strong> This will permanently delete the{" "}
											{deleteWorkspace.name} workspace, including all associated tasks, calendars, and documentation.
										</div>
									</div>

									<label className={clsx(styles["workspace-field"], styles["workspace-delete-field"])}>
										<span className={styles["workspace-delete-label"]}>
											Type {deleteWorkspace.name.toUpperCase()} to confirm
										</span>
										<input
											type="text"
											value={deleteWorkspaceConfirmation}
											onChange={(event) => onDeleteWorkspaceConfirmationChange(event.target.value)}
											className={clsx(styles["workspace-input"], styles["workspace-delete-input"])}
											placeholder="Enter workspace name"
											autoComplete="off"
										/>
									</label>

									<div className={styles["workspace-delete-actions"]}>
										<Button
											type="button"
											variant="secondary"
											size="lg"
											className={styles["workspace-delete-cancel"]}
											onClick={onCancelDelete}
										>
											Cancel
										</Button>
										<Button
											type="button"
											variant="danger"
											size="lg"
											className={styles["workspace-delete-confirm"]}
											onClick={onConfirmDelete}
											disabled={!isDeleteConfirmationValid || isSaving}
											icon="trash"
										>
											Delete Permanently
										</Button>
									</div>
								</div>
							)}

							{(localError || error) && (
								<Text size="sm" className={styles["error-text"]}>
									{localError ?? error}
								</Text>
							)}
						</div>
					</section>
				)}
			</div>
		</div>
	);
}

export function WorkspaceManagerDialog(props: WorkspaceManagerSharedProps) {
	return (
		<Dialog.Portal>
			<Dialog.Overlay className={styles["manage-overlay"]} />
			<Dialog.Content className={styles["manage-dialog"]}>
				<Dialog.Title className={styles["visually-hidden"]}>Switch Workspace</Dialog.Title>
				<Dialog.Description className={styles["visually-hidden"]}>
					Manage your productivity environments.
				</Dialog.Description>
				<WorkspaceManagerPanel
					{...props}
					closeAction={
						<Dialog.Close asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className={styles["manage-close"]}
								aria-label="Close workspace manager"
								icon="close"
							/>
						</Dialog.Close>
					}
				/>
			</Dialog.Content>
		</Dialog.Portal>
	);
}
