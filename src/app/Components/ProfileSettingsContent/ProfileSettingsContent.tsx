"use client";

import { Icon } from "@atoms/Icons/Icon";
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
	const tabIconSize = 24;

	const tabs: { id: TabType; label: string; icon: "general" | "preferences" | "connectors" }[] = [
		{ id: "general", label: "General", icon: "general" },
		{ id: "preferences", label: "Preferences", icon: "preferences" },
		{ id: "connectors", label: "Connectors", icon: "connectors" },
	];

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
				return <PreferencesSettings styles={styles} />;
			case "connectors":
				return <ConnectorsSettings styles={styles} />;
			default:
				return null;
		}
	};

	const navigation = (
		<nav className={styles[navigationLayout]} aria-label="Settings sections">
			{tabs.map((tab) => {
				const isActive = selectedTab === tab.id;
				return (
					<button
						key={tab.id}
						type="button"
						className={clsx(styles["tab-button"], isActive && styles["tab-button--active"])}
						onClick={() => setSelectedTab(tab.id)}
					>
						<span className={styles["tab-button-icon"]}>
							<Icon name={tab.icon} size={tabIconSize} className={styles["tab-icon-glyph"]} />
						</span>
						<span className={styles["tab-button-label"]}>{tab.label}</span>
					</button>
				);
			})}
		</nav>
	);

	if (navigationLayout === "tab-navigation") {
		return (
			<div className={styles["settings-layout--stacked"]}>
				{navigation}
				<div className={styles["content-area"]}>
					{renderTabContent()}
				</div>
			</div>
		);
	}

	return (
		<div className={styles["settings-layout"]}>
			<aside className={styles["settings-sidebar"]}>
				{navigation}
			</aside>
			<div className={styles["content-area"]}>
				{renderTabContent()}
			</div>
		</div>
	);
}
