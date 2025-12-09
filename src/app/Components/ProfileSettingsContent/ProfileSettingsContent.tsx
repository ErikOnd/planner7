"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@atoms/Button/Button";
import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";
import { useState } from "react";
import { ProfileData } from "../../../hooks/useProfileSettings";

type TabType = "general" | "account" | "connectors";

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
	styles,
}: ProfileSettingsContentProps) {
	const [selectedTab, setSelectedTab] = useState<TabType>("general");
	const { theme, setTheme } = useTheme();

	const renderTabContent = () => {
		switch (selectedTab) {
			case "general":
				return (
					<div className={styles["tab-content"]}>
						<section className={styles["settings-section"]}>
							<h3 className={styles["section-heading"]}>Profile</h3>
							{error && <div className={styles["error-message"]}>{error}</div>}
							{successMessage && <div className={styles["success-message"]}>{successMessage}</div>}
							<div className={styles["form-group"]}>
								<label className={styles["form-label"]} htmlFor="name">Name</label>
								<input
									type="text"
									id="name"
									className={styles["form-input"]}
									placeholder="Enter your name"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									disabled={isLoading || isSaving}
								/>
							</div>
							<div className={styles["form-group"]}>
								<label className={styles["form-label"]} htmlFor="email">Email</label>
								<input
									type="email"
									id="email"
									className={styles["form-input"]}
									placeholder="Enter your email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={isLoading || isSaving}
								/>
								{originalProfile?.pendingEmail && (
									<div className={styles["pending-email-notice"]}>
										<span className={styles["pending-email-label"]}>Pending confirmation:</span>{" "}
										<span className={styles["pending-email-value"]}>{originalProfile.pendingEmail}</span>
									</div>
								)}
							</div>
							{hasChanges && (
								<div className={styles["save-button-container"]}>
									<Button
										variant="primary"
										onClick={handleSave}
										disabled={isSaving}
									>
										{isSaving ? "Saving..." : "Save Changes"}
									</Button>
								</div>
							)}
						</section>

						<section className={styles["settings-section"]}>
							<h3 className={styles["section-heading"]}>Notifications</h3>
							<div className={styles["notification-item"]}>
								<div className={styles["notification-info"]}>
									<span className={styles["notification-label"]}>Email notifications</span>
									<span className={styles["notification-description"]}>Receive email updates about your tasks</span>
								</div>
								<Switch.Root className={styles["switch"]} defaultChecked>
									<Switch.Thumb className={styles["switch-thumb"]} />
								</Switch.Root>
							</div>
							<div className={styles["notification-item"]}>
								<div className={styles["notification-info"]}>
									<span className={styles["notification-label"]}>Push notifications</span>
									<span className={styles["notification-description"]}>Get notified about upcoming tasks</span>
								</div>
								<Switch.Root className={styles["switch"]}>
									<Switch.Thumb className={styles["switch-thumb"]} />
								</Switch.Root>
							</div>
						</section>

						<section className={styles["settings-section"]}>
							<h3 className={styles["section-heading"]}>Appearance</h3>
							<p className={styles["section-description"]}>Color mode</p>
							<div className={styles["theme-selector"]}>
								<button
									className={clsx(styles["theme-card"], theme === "light" && styles["theme-card--active"])}
									onClick={() => setTheme("light")}
								>
									<div className={styles["theme-preview"]}>
										<div className={styles["theme-preview-light"]}></div>
									</div>
									<span className={styles["theme-label"]}>Light</span>
								</button>
								<button
									className={clsx(styles["theme-card"], theme === "system" && styles["theme-card--active"])}
									onClick={() => setTheme("system")}
								>
									<div className={styles["theme-preview"]}>
										<div className={styles["theme-preview-system"]}></div>
									</div>
									<span className={styles["theme-label"]}>Match system</span>
								</button>
								<button
									className={clsx(styles["theme-card"], theme === "dark" && styles["theme-card--active"])}
									onClick={() => setTheme("dark")}
								>
									<div className={styles["theme-preview"]}>
										<div className={styles["theme-preview-dark"]}></div>
									</div>
									<span className={styles["theme-label"]}>Dark</span>
								</button>
							</div>
						</section>
					</div>
				);
			case "account":
				return (
					<div className={styles["tab-content"]}>
						<h2 className={styles["section-title"]}>Account Settings</h2>
						<p>Account settings content goes here</p>
					</div>
				);
			case "connectors":
				return (
					<div className={styles["tab-content"]}>
						<h2 className={styles["section-title"]}>Connectors</h2>
						<p>Connectors content goes here</p>
					</div>
				);
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
					className={clsx(styles["tab-button"], selectedTab === "account" && styles["tab-button--active"])}
					onClick={() => setSelectedTab("account")}
				>
					Account
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
