"use client";

import { ProfileSettingsContent } from "@components/ProfileSettingsContent/ProfileSettingsContent";
import { useProfileSettings } from "@hooks/useProfileSettings";
import styles from "./ProfileContent.module.scss";

export function ProfileContent() {
	const profileSettings = useProfileSettings();

	return (
		<div className={styles["profile-container"]}>
			<ProfileSettingsContent {...profileSettings} styles={styles} />
		</div>
	);
}
