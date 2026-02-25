"use client";

import { useProfileSessionActions } from "@hooks/useProfileSessionActions";
import { useProfileSettings } from "@hooks/useProfileSettings";
import { ProfileSettingsContent } from "./ProfileSettingsContent";
import shellStyles from "./ProfileSettingsShell.module.scss";

type ProfileSettingsPanelProps = {
	styles: Record<string, string>;
	containerClassName?: string;
	navigationLayout?: "side-menu" | "tab-navigation";
};

export function ProfileSettingsPanel({ styles, containerClassName, navigationLayout }: ProfileSettingsPanelProps) {
	const { originalProfile, profileForm, passwordForm, uiState, messages, actions } = useProfileSettings();
	const { handleLogout, handleAccountDeleted } = useProfileSessionActions();
	const mergedStyles = { ...shellStyles, ...styles };

	const content = (
		<ProfileSettingsContent
			originalProfile={originalProfile}
			profileForm={profileForm}
			passwordForm={passwordForm}
			uiState={uiState}
			messages={messages}
			actions={actions}
			handleLogout={handleLogout}
			handleAccountDeleted={handleAccountDeleted}
			styles={mergedStyles}
			navigationLayout={navigationLayout}
		/>
	);

	if (!containerClassName) {
		return content;
	}

	return <div className={containerClassName}>{content}</div>;
}
