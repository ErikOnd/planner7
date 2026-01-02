"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { ProfileData } from "@hooks/useProfileSettings";
import clsx from "clsx";
import { useState } from "react";
import { ConnectorsSettings } from "./ConnectorsSettings";
import { GeneralSettings } from "./GeneralSettings";
import { PreferencesSettings } from "./PreferencesSettings";

type TabType = "general" | "preferences" | "connectors";

type ProfileSettingsContentProps = {
	originalProfile: ProfileData | null;
	displayName: string;
	setDisplayName: (value: string) => void;
	email: string;
	setEmail: (value: string) => void;
	isLoading: boolean;
	isSaving: boolean;
	error: string | null;
	successMessage: string | null;
	hasChanges: boolean;
	handleSave: () => Promise<void>;
	handleLogout?: () => Promise<void>;
	styles: Record<string, string>;
};

export function ProfileSettingsContent({
	originalProfile,
	displayName,
	setDisplayName,
	email,
	setEmail,
	isLoading,
	isSaving,
	error,
	successMessage,
	hasChanges,
	handleSave,
	handleLogout,
	styles,
}: ProfileSettingsContentProps) {
	const [selectedTab, setSelectedTab] = useState<TabType>("general");
	const { theme, setTheme } = useTheme();

	const renderTabContent = () => {
		switch (selectedTab) {
			case "general":
				return (
					<GeneralSettings
						originalProfile={originalProfile}
						displayName={displayName}
						setDisplayName={setDisplayName}
						email={email}
						setEmail={setEmail}
						isLoading={isLoading}
						isSaving={isSaving}
						error={error}
						successMessage={successMessage}
						hasChanges={hasChanges}
						handleSave={handleSave}
						handleLogout={handleLogout}
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
			<nav className={styles["side-menu"] || styles["tab-navigation"]}>
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
