"use client";

import { Button } from "@atoms/Button/Button";
import { ProfileSettingsContent } from "@components/ProfileSettingsContent/ProfileSettingsContent";
import { useProfileSettings } from "@hooks/useProfileSettings";
import * as Dialog from "@radix-ui/react-dialog";
import { createClient } from "@utils/supabase/client";
import { useRouter } from "next/navigation";
import React from "react";
import styles from "./ProfileDialog.module.scss";

type ProfileDialogProps = {
	children: React.ReactNode;
};

export function ProfileDialog({ children }: ProfileDialogProps) {
	const { originalProfile, profileForm, passwordForm, uiState, messages, actions } = useProfileSettings();
	const router = useRouter();
	const supabase = createClient();

	const handleLogout = async () => {
		await supabase.auth.signOut();
		router.push("/login");
	};

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
						<ProfileSettingsContent
							originalProfile={originalProfile}
							profileForm={profileForm}
							passwordForm={passwordForm}
							uiState={uiState}
							messages={messages}
							actions={actions}
							handleLogout={handleLogout}
							styles={styles}
						/>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
