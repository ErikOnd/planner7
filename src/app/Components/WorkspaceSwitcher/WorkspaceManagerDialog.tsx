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
	switchingWorkspaceId: string | null;
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

function getWorkspaceInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("") || "W";
}

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
		switchingWorkspaceId,
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
	const gradientMap = Object.fromEntries(gradientPresets);

	return (
		<Dialog.Portal>
			<Dialog.Overlay className={styles["manage-overlay"]} />
			<Dialog.Content className={styles["manage-dialog"]}>
				<div className={styles["manage-header"]}>
					<div>
						<Dialog.Title className={styles["manage-title"]}>Switch Workspace</Dialog.Title>
						<Text size="sm" className={styles["manage-subtitle"]}>
							Manage your productivity environments
						</Text>
					</div>
					<Dialog.Close asChild>
						<Button type="button" variant="secondary" icon="close" aria-label="Close workspace manager" />
					</Dialog.Close>
				</div>
				<div className={styles["manage-divider"]} />

				<div className={styles["switch-section"]}>
					<div className={styles["switch-list"]}>
						{workspaces.map((workspace) => {
							const isActive = workspace.id === activeWorkspaceId;
							const isEditing = workspace.id === editingWorkspaceId;
							const isSwitching = workspace.id === switchingWorkspaceId;
							const gradient = gradientMap[workspace.gradientPreset] ?? gradientPresets[0]?.[1] ?? { from: "#555", to: "#888" };

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
											<button
												type="button"
												className={clsx(styles["switch-main"], isActive && styles["switch-main--active"])}
												onClick={() => {
													onQuickSwitchWorkspace(workspace.id);
													setIsCreateOpen(false);
												}}
												disabled={isSaving || Boolean(switchingWorkspaceId) || isActive}
												style={{
													["--workspace-grad-from" as string]: gradient.from,
													["--workspace-grad-to" as string]: gradient.to,
												}}
											>
												<span className={styles["switch-main-avatar"]}>{getWorkspaceInitials(workspace.name)}</span>
												<span className={styles["switch-main-content"]}>
													<span className={styles["switch-main-label"]}>{workspace.name}</span>
													<span className={styles["switch-main-sub"]}>
														{isSwitching ? "Switching workspace..." : isActive ? "Active workspace" : "Tap to switch"}
													</span>
												</span>
												{isSwitching && <span className={styles["switch-loading-dot"]} aria-hidden />}
											</button>
										)}

									<div className={styles["switch-actions"]}>
										{isEditing
											? (
												<>
													<button
														type="button"
														className={`${styles["switch-action"]} ${styles["switch-action--save"]}`}
														onClick={onSaveRename}
													>
														Save
													</button>
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
														disabled={isSaving || Boolean(switchingWorkspaceId)}
													>
														<Icon name="pencil" size={14} />
													</button>
													<button
														type="button"
														className={clsx(styles["switch-action-icon"], styles["switch-action-icon--danger"])}
														onClick={(event) => {
															event.stopPropagation();
															onRequestDelete(workspace.id, workspace.name);
														}}
														aria-label={`Delete ${workspace.name}`}
														disabled={workspaces.length <= 1 || isSaving || Boolean(switchingWorkspaceId)}
													>
														<Icon name="trash" size={14} />
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
					<Button
						type="button"
						variant="secondary"
						fontWeight={700}
						wrapText={false}
						className={styles["create-toggle-button"]}
						onClick={() => setIsCreateOpen((value) => !value)}
					>
						<Icon name="plus" size={18} />
						<span>{isCreateOpen ? "Hide New Workspace" : "New Workspace"}</span>
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
