"use client";

import { ProfileSettingsContent } from "@components/ProfileSettingsContent/ProfileSettingsContent";
import { useProfileSettings } from "@hooks/useProfileSettings";
import { createClient } from "@utils/supabase/client";
import { useRouter } from "next/navigation";
import styles from "./ProfileContent.module.scss";

export function ProfileContent() {
	const { originalProfile, profileForm, passwordForm, uiState, messages, actions } = useProfileSettings();
	const router = useRouter();
	const supabase = createClient();

	const handleLogout = async () => {
		await supabase.auth.signOut();
		router.push("/login");
	};

	return (
		<div className={styles["profile-container"]}>
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
	);
}
