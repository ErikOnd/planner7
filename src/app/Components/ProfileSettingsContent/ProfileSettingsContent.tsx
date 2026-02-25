"use client";

import { useTheme } from "@/contexts/ThemeContext";
import {
	Messages,
	PasswordFormData,
	ProfileActions,
	ProfileData,
	ProfileFormData,
	UIState,
} from "@hooks/useProfileSettings";
import clsx from "clsx";
import { useState } from "react";
import { ConnectorsSettings } from "./ConnectorsSettings";
import { GeneralSettings } from "./GeneralSettings";
import { PreferencesSettings } from "./PreferencesSettings";

type TabType = "general" | "preferences" | "connectors";
type NavigationLayout = "side-menu" | "tab-navigation";

type ProfileSettingsContentProps = {
	originalProfile: ProfileData | null;
	profileForm: ProfileFormData;
	passwordForm: PasswordFormData;
	uiState: UIState;
	messages: Messages;
	actions: ProfileActions;
	handleLogout?: () => Promise<void>;
	handleAccountDeleted?: () => Promise<void>;
	styles: Record<string, string>;
	navigationLayout?: NavigationLayout;
};

export function ProfileSettingsContent({
	originalProfile,
	profileForm,
	passwordForm,
	uiState,
	messages,
	actions,
	handleLogout,
	handleAccountDeleted,
	styles,
	navigationLayout = "side-menu",
}: ProfileSettingsContentProps) {
	const [selectedTab, setSelectedTab] = useState<TabType>("general");
	const { theme, setTheme } = useTheme();

	const renderTabContent = () => {
		switch (selectedTab) {
			case "general":
				return (
					<GeneralSettings
						originalProfile={originalProfile}
						profileForm={profileForm}
						passwordForm={passwordForm}
						uiState={uiState}
						messages={messages}
						actions={actions}
						handleLogout={handleLogout}
						handleAccountDeleted={handleAccountDeleted}
						styles={styles}
					/>
				);
			case "preferences":
				return <PreferencesSettings theme={theme} setTheme={setTheme} styles={styles} />;
			case "connectors":
				return <ConnectorsSettings styles={styles} />;
			default:
				return null;
		}
	};

	return (
		<>
			<nav className={styles[navigationLayout]}>
				<button
					className={clsx(styles["tab-button"], selectedTab === "general" && styles["tab-button--active"])}
					onClick={() => setSelectedTab("general")}
				>
					General
				</button>
				<button
					className={clsx(styles["tab-button"], selectedTab === "preferences" && styles["tab-button--active"])}
					onClick={() => setSelectedTab("preferences")}
				>
					Preferences
				</button>
				<button
					className={clsx(styles["tab-button"], selectedTab === "connectors" && styles["tab-button--active"])}
					onClick={() => setSelectedTab("connectors")}
				>
					Connectors
				</button>
			</nav>
			<div className={styles["content-area"]}>
				{renderTabContent()}
			</div>
		</>
	);
}
