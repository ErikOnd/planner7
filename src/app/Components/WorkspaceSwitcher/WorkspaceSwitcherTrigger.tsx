"use client";

import { Button } from "@atoms/Button/Button";
import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode } from "react";
import type { WorkspaceSummary } from "../../actions/workspaces";
import styles from "./WorkspaceSwitcherTrigger.module.scss";

type WorkspaceSwitcherTriggerProps = {
	compact: boolean;
	variant: "default" | "sidebar" | "chip" | "tab";
	workspaces: WorkspaceSummary[];
	activeWorkspaceId: string | null;
	activeLabel: string;
	activeInitials: string;
	activeGradient: { from: string; to: string };
	isLoading: boolean;
	isSaving: boolean;
	isManageOpen: boolean;
	onOpenManage: (open: boolean) => void;
	onSwitchWorkspace: (workspaceId: string) => void;
	manageContent: ReactNode;
};

export function WorkspaceSwitcherTrigger(props: WorkspaceSwitcherTriggerProps) {
	const {
		compact,
		variant,
		workspaces,
		activeWorkspaceId,
		activeLabel,
		activeInitials,
		activeGradient,
		isLoading,
		isSaving,
		isManageOpen,
		onOpenManage,
		onSwitchWorkspace,
		manageContent,
	} = props;

	return (
		<div className={styles["workspace-switcher"]} data-compact={compact} data-variant={variant}>
			{variant === "sidebar"
				? (
					<Dialog.Root open={isManageOpen} onOpenChange={onOpenManage}>
						<Dialog.Trigger asChild>
							<button type="button" className={styles["workspace-card-button"]} aria-label="Open workspace switcher">
								<div
									className={styles["workspace-card"]}
									style={{
										["--workspace-grad-from" as string]: activeGradient.from,
										["--workspace-grad-to" as string]: activeGradient.to,
									}}
								>
									<div className={styles["workspace-avatar"]}>{activeInitials}</div>
									<div className={styles["workspace-card-content"]}>
										<span className={styles["workspace-card-label"]}>Workspace</span>
										<span className={styles["workspace-card-name"]}>{activeLabel}</span>
									</div>
								</div>
							</button>
						</Dialog.Trigger>
						{manageContent}
					</Dialog.Root>
				)
				: variant === "chip"
				? (
					<Dialog.Root open={isManageOpen} onOpenChange={onOpenManage}>
						<Dialog.Trigger asChild>
							<button
								type="button"
								className={styles["workspace-chip"]}
								style={{
									["--workspace-grad-from" as string]: activeGradient.from,
									["--workspace-grad-to" as string]: activeGradient.to,
								}}
								aria-label={`Open workspace switcher, active workspace ${activeLabel}`}
							>
								<span className={styles["workspace-chip-label"]}>{activeLabel}</span>
							</button>
						</Dialog.Trigger>
						{manageContent}
					</Dialog.Root>
				)
				: variant === "tab"
				? (
					<Dialog.Root open={isManageOpen} onOpenChange={onOpenManage}>
						<Dialog.Trigger asChild>
							<button
								type="button"
								className={styles["workspace-tab-trigger"]}
								style={{
									["--workspace-grad-from" as string]: activeGradient.from,
									["--workspace-grad-to" as string]: activeGradient.to,
								}}
								aria-label={`Open workspace switcher, active workspace ${activeLabel}`}
							>
								<span className={styles["workspace-tab-label"]}>{activeLabel}</span>
							</button>
						</Dialog.Trigger>
						{manageContent}
					</Dialog.Root>
				)
				: (
					<>
						<label
							className={styles["workspace-label"]}
							htmlFor={compact ? "workspace-select-mobile" : "workspace-select"}
						>
							Workspace
						</label>
						<select
							id={compact ? "workspace-select-mobile" : "workspace-select"}
							className={styles["workspace-select"]}
							value={activeWorkspaceId ?? ""}
							disabled={isLoading || isSaving || workspaces.length === 0}
							onChange={(event) => {
								onSwitchWorkspace(event.target.value);
							}}
						>
							{workspaces.map((workspace) => (
								<option key={workspace.id} value={workspace.id}>
									{workspace.name}
								</option>
							))}
						</select>
						<Dialog.Root open={isManageOpen} onOpenChange={onOpenManage}>
							<Dialog.Trigger asChild>
								<Button type="button" variant="secondary" className={styles["manage-button"]} fontWeight={600}>
									Manage
								</Button>
							</Dialog.Trigger>
							{manageContent}
						</Dialog.Root>
					</>
				)}
		</div>
	);
}
