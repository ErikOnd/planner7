"use client";

import type { WorkspaceGradientPreset } from "@/lib/workspaceGradients";
import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";
import { GradientPicker } from "@components/WorkspaceSwitcher/GradientPicker";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { FormEvent, useState } from "react";
import type { WorkspaceSummary } from "../../actions/workspaces";
import styles from "./WorkspaceManagerDialog.module.scss";

type WorkspaceManagerDialogProps = {
	workspaces: WorkspaceSummary[];
	activeWorkspaceId: string | null;
	isSaving: boolean;
	localError: string | null;
	error: string | null;
	gradientPresets: [WorkspaceGradientPreset, { from: string; to: string }][];
	newWorkspaceName: string;
	newWorkspaceGradient: WorkspaceGradientPreset;
	editingWorkspaceId: string | null;
	editingName: string;
	editingGradient: WorkspaceGradientPreset;
	onNewWorkspaceNameChange: (value: string) => void;
	onNewWorkspaceGradientChange: (preset: WorkspaceGradientPreset) => void;
	onEditingNameChange: (value: string) => void;
	onEditingGradientChange: (preset: WorkspaceGradientPreset) => void;
	onCreateWorkspace: (event: FormEvent) => void;
	onQuickSwitchWorkspace: (workspaceId: string) => void;
	onStartEditingWorkspace: (workspaceId: string, name: string) => void;
	onSaveRename: () => void;
	onCancelEditing: () => void;
	onRequestDelete: (workspaceId: string, name: string) => void;
};

export function WorkspaceManagerDialog(props: WorkspaceManagerDialogProps) {
	const {
		workspaces,
		activeWorkspaceId,
		isSaving,
		localError,
		error,
		gradientPresets,
		newWorkspaceName,
		newWorkspaceGradient,
		editingWorkspaceId,
		editingName,
		editingGradient,
		onNewWorkspaceNameChange,
		onNewWorkspaceGradientChange,
		onEditingNameChange,
		onEditingGradientChange,
		onCreateWorkspace,
		onQuickSwitchWorkspace,
		onStartEditingWorkspace,
		onSaveRename,
		onCancelEditing,
		onRequestDelete,
	} = props;
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	return (
		<Dialog.Portal>
			<Dialog.Overlay className={styles["manage-overlay"]} />
			<Dialog.Content className={styles["manage-dialog"]}>
				<div className={styles["manage-header"]}>
					<Dialog.Title className={styles["manage-title"]}>Workspaces</Dialog.Title>
					<Dialog.Close asChild>
						<Button type="button" variant="secondary" icon="close" aria-label="Close workspace manager" />
					</Dialog.Close>
				</div>

				<div className={styles["switch-section"]}>
					<div className={styles["switch-list"]}>
						{workspaces.map((workspace) => {
							const isActive = workspace.id === activeWorkspaceId;
							const isEditing = workspace.id === editingWorkspaceId;

							return (
								<div
									key={workspace.id}
									className={clsx(styles["switch-item"], isActive && styles["switch-item--active"])}
								>
									{isEditing
										? (
											<div className={styles["workspace-edit-block"]}>
												<input
													type="text"
													value={editingName}
													onChange={(event) => onEditingNameChange(event.target.value)}
													className={styles["workspace-input"]}
													maxLength={60}
												/>
												<GradientPicker
													idPrefix={workspace.id}
													selected={editingGradient}
													presets={gradientPresets}
													onPick={onEditingGradientChange}
													className={clsx(styles["gradient-picker"], styles["gradient-picker--compact"])}
													dotClassName={styles["gradient-dot"]}
													activeDotClassName={styles["gradient-dot--active"]}
												/>
											</div>
										)
										: (
											<Button
												type="button"
												variant={isActive ? "primary" : "secondary"}
												className={clsx(styles["switch-main"], isActive && styles["switch-main--active"])}
												onClick={() => {
													onQuickSwitchWorkspace(workspace.id);
													setIsCreateOpen(false);
												}}
												wrapText={false}
											>
												<span className={styles["switch-main-label"]}>{workspace.name}</span>
											</Button>
										)}

									<div className={styles["switch-actions"]}>
										{isEditing
											? (
												<>
													<button type="button" className={styles["switch-action"]} onClick={onSaveRename}>Save</button>
													<button type="button" className={styles["switch-action"]} onClick={onCancelEditing}>
														Cancel
													</button>
												</>
											)
											: (
												<>
													<button
														type="button"
														className={styles["switch-action-icon"]}
														onClick={(event) => {
															event.stopPropagation();
															onStartEditingWorkspace(workspace.id, workspace.name);
														}}
														aria-label={`Rename ${workspace.name}`}
													>
														<Icon name="pencil" />
													</button>
													<button
														type="button"
														className={clsx(styles["switch-action-icon"], styles["switch-action-icon--danger"])}
														onClick={(event) => {
															event.stopPropagation();
															onRequestDelete(workspace.id, workspace.name);
														}}
														aria-label={`Delete ${workspace.name}`}
														disabled={workspaces.length <= 1 || isSaving}
													>
														<Icon name="trash" />
													</button>
												</>
											)}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className={styles["create-toggle-row"]}>
					<Button type="button" variant="secondary" fontWeight={700} onClick={() => setIsCreateOpen((value) => !value)}>
						{isCreateOpen ? "Hide Create Workspace" : "Create New Workspace"}
					</Button>
				</div>

				{isCreateOpen && (
					<form className={styles["create-form"]} onSubmit={onCreateWorkspace}>
						<Text size="sm" fontWeight={700}>Create Workspace</Text>
						<input
							type="text"
							value={newWorkspaceName}
							onChange={(event) => onNewWorkspaceNameChange(event.target.value)}
							className={clsx(styles["workspace-input"], styles["workspace-input--create"])}
							placeholder="New workspace name"
							maxLength={60}
						/>
						<div className={styles["create-controls"]}>
							<GradientPicker
								idPrefix="new"
								selected={newWorkspaceGradient}
								presets={gradientPresets}
								onPick={onNewWorkspaceGradientChange}
								className={styles["gradient-picker"]}
								dotClassName={styles["gradient-dot"]}
								activeDotClassName={styles["gradient-dot--active"]}
							/>
							<Button
								type="submit"
								variant="primary"
								fontWeight={700}
								disabled={isSaving}
								className={styles["create-submit"]}
							>
								Create
							</Button>
						</div>
					</form>
				)}

				{(localError || error) && <Text size="sm" className={styles["error-text"]}>{localError ?? error}</Text>}
			</Dialog.Content>
		</Dialog.Portal>
	);
}
