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
	currentPassword: string;
	setCurrentPassword: (value: string) => void;
	newPassword: string;
	setNewPassword: (value: string) => void;
	confirmPassword: string;
	setConfirmPassword: (value: string) => void;
	isLoading: boolean;
	isSaving: boolean;
	isChangingPassword: boolean;
	error: string | null;
	successMessage: string | null;
	passwordError: string | null;
	passwordSuccessMessage: string | null;
	hasChanges: boolean;
	handleSave: () => Promise<void>;
	handlePasswordChange: () => Promise<void>;
	handleLogout?: () => Promise<void>;
	styles: Record<string, string>;
};

export function ProfileSettingsContent({
	originalProfile,
	displayName,
	setDisplayName,
	email,
	setEmail,
	currentPassword,
	setCurrentPassword,
	newPassword,
	setNewPassword,
	confirmPassword,
	setConfirmPassword,
	isLoading,
	isSaving,
	isChangingPassword,
	error,
	successMessage,
	passwordError,
	passwordSuccessMessage,
	hasChanges,
	handleSave,
	handlePasswordChange,
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
						currentPassword={currentPassword}
						setCurrentPassword={setCurrentPassword}
						newPassword={newPassword}
						setNewPassword={setNewPassword}
						confirmPassword={confirmPassword}
						setConfirmPassword={setConfirmPassword}
						isLoading={isLoading}
						isSaving={isSaving}
						isChangingPassword={isChangingPassword}
						error={error}
						successMessage={successMessage}
						passwordError={passwordError}
						passwordSuccessMessage={passwordSuccessMessage}
						hasChanges={hasChanges}
						handleSave={handleSave}
						handlePasswordChange={handlePasswordChange}
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
