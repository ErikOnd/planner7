"use client";

import { ProfileSettingsPanel } from "@components/ProfileSettingsContent/ProfileSettingsPanel";
import styles from "./ProfileContent.module.scss";

export function ProfileContent() {
	return (
		<ProfileSettingsPanel
			styles={styles}
			containerClassName={styles["profile-container"]}
			navigationLayout="tab-navigation"
		/>
	);
}
