"use client";

import { Button } from "@atoms/Button/Button";
import { ProfileSettingsPanel } from "@components/ProfileSettingsContent/ProfileSettingsPanel";
import * as Dialog from "@radix-ui/react-dialog";
import React from "react";
import styles from "./ProfileDialog.module.scss";

type ProfileDialogProps = {
	children: React.ReactNode;
};

export function ProfileDialog({ children }: ProfileDialogProps) {
	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				{children}
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className={styles["dialog-overlay"]} />
				<Dialog.Content className={styles["dialog-content"]}>
					<div className={styles["dialog-header"]}>
						<Dialog.Title className={styles["dialog-title"]}>Profile</Dialog.Title>
						<Dialog.Close asChild>
							<Button variant="secondary" icon="close" className={styles["close-button"]} aria-label="Close dialog" />
						</Dialog.Close>
					</div>
					<div className={styles["dialog-body"]}>
						<ProfileSettingsPanel styles={styles} />
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
