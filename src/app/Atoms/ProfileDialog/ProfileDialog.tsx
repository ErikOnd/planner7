"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@atoms/Button/Button";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { getUserProfile, updateUserProfile } from "../../actions/profile";
import styles from "./ProfileDialog.module.scss";

type ProfileDialogProps = {
	children: React.ReactNode;
};

type TabType = "general" | "account" | "connectors";

type ProfileData = {
	displayName: string;
	email: string;
 	pendingEmail?: string;
};

export function ProfileDialog({ children }: ProfileDialogProps) {
	const [selectedTab, setSelectedTab] = useState<TabType>("general");
	const { theme, setTheme } = useTheme();

	const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const hasChanges = originalProfile
		&& (displayName !== originalProfile.displayName || email !== originalProfile.email);

	useEffect(() => {
		const fetchProfile = async () => {
			setIsLoading(true);

			// Refresh the session to get latest email status
			const { createClient } = await import("@utils/supabase/client");
			const supabase = createClient();
			await supabase.auth.refreshSession();

			const result = await getUserProfile();

			if (result.success && result.data) {
				setOriginalProfile(result.data);
				setDisplayName(result.data.displayName);
				setEmail(result.data.email);
			} else {
				setError(result.error || "Failed to load profile");
			}

			setIsLoading(false);
		};

		fetchProfile();
	}, []);

	const handleSave = async () => {
		if (!hasChanges) return;

		setIsSaving(true);
		setError(null);
		setSuccessMessage(null);

		const emailChanged = originalProfile && email !== originalProfile.email;

		const result = await updateUserProfile({
			displayName,
			email,
		});

		if (result.success && result.data) {
			setOriginalProfile(result.data);
			setDisplayName(result.data.displayName);
			setEmail(result.data.email);

			if (emailChanged) {
				setSuccessMessage(
					"A confirmation email has been sent to your new email address. Please check your inbox and confirm your new email.",
				);
			} else {
				setSuccessMessage("Profile updated successfully!");
			}
		} else {
			setError(result.error || "Failed to save profile");
		}

		setIsSaving(false);
	};

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
										<span className={styles["pending-email-label"]}>Pending confirmation:</span>
										{" "}
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
		<Dialog.Root>
			<Dialog.Trigger asChild>
				{children}
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className={styles["dialog-overlay"]} />
				<Dialog.Content className={styles["dialog-content"]}>
					<div className={styles["dialog-header"]}>
						<Dialog.Title className={styles["dialog-title"]}>Profile</Dialog.Title>
						<Dialog.Close asChild>
							<Button variant="secondary" className={styles["close-button"]}>
								<span className={styles["close-icon"]}>×</span>
							</Button>
						</Dialog.Close>
					</div>
					<div className={styles["dialog-body"]}>
						<nav className={styles["side-menu"]}>
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
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
