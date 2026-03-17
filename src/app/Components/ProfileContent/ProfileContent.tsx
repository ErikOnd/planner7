"use client";

import { ProfileSettingsPanel } from "@components/ProfileSettingsContent/ProfileSettingsPanel";
import styles from "./ProfileContent.module.scss";

export function ProfileContent() {
	return (
		<div className={styles["profile-shell"]}>
			<ProfileSettingsPanel
				styles={styles}
				containerClassName={styles["profile-panel"]}
				navigationLayout="tab-navigation"
			/>
		</div>
	);
}
