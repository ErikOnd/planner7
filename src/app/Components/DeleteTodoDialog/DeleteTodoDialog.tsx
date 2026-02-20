"use client";

import { Button } from "@atoms/Button/Button";
import { AlertDialog } from "radix-ui";
import styles from "./DeleteTodoDialog.module.scss";

type DeleteTodoDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	title?: string;
	description?: string;
	confirmLabel?: string;
};

export function DeleteTodoDialog({
	open,
	onOpenChange,
	onConfirm,
	title = "Delete todo?",
	description = "This action cannot be undone.",
	confirmLabel = "Delete",
}: DeleteTodoDialogProps) {
	return (
		<AlertDialog.Root open={open} onOpenChange={onOpenChange}>
			<AlertDialog.Portal>
				<AlertDialog.Overlay className={styles["delete-overlay"]} />
				<AlertDialog.Content className={styles["delete-dialog"]}>
					<AlertDialog.Title className={styles["delete-title"]}>
						{title}
					</AlertDialog.Title>
					<AlertDialog.Description className={styles["delete-description"]}>
						{description}
					</AlertDialog.Description>
					<div className={styles["delete-actions"]}>
						<AlertDialog.Cancel asChild>
							<Button variant="secondary" fontWeight={500}>Cancel</Button>
						</AlertDialog.Cancel>
						<AlertDialog.Action asChild>
							<Button className={styles["delete-button"]} onClick={onConfirm} fontWeight={700} autoFocus>
								{confirmLabel}
							</Button>
						</AlertDialog.Action>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	);
}
