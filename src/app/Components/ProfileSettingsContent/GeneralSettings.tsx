"use client";

import { Badge } from "@atoms/Badge/Badge";
import { Button } from "@atoms/Button/Button";
import { Text } from "@atoms/Text/Text";
import { ProfileData } from "@hooks/useProfileSettings";
import * as Switch from "@radix-ui/react-switch";

type GeneralSettingsProps = {
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

export function GeneralSettings({
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
}: GeneralSettingsProps) {
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
				<h3 className={styles["section-heading"]}>Password</h3>
				{passwordError && <div className={styles["error-message"]}>{passwordError}</div>}
				{passwordSuccessMessage && <div className={styles["success-message"]}>{passwordSuccessMessage}</div>}
				<div className={styles["form-group"]}>
					<label className={styles["form-label"]} htmlFor="currentPassword">Current Password</label>
					<input
						type="password"
						id="currentPassword"
						className={styles["form-input"]}
						placeholder="Enter your current password"
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						disabled={isLoading || isChangingPassword}
					/>
				</div>
				<div className={styles["form-group"]}>
					<label className={styles["form-label"]} htmlFor="newPassword">New Password</label>
					<input
						type="password"
						id="newPassword"
						className={styles["form-input"]}
						placeholder="Enter your new password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						disabled={isLoading || isChangingPassword}
					/>
				</div>
				<div className={styles["form-group"]}>
					<label className={styles["form-label"]} htmlFor="confirmPassword">Confirm New Password</label>
					<input
						type="password"
						id="confirmPassword"
						className={styles["form-input"]}
						placeholder="Confirm your new password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						disabled={isLoading || isChangingPassword}
					/>
				</div>
				{(currentPassword || newPassword || confirmPassword) && (
					<div className={styles["save-button-container"]}>
						<Button
							variant="primary"
							onClick={handlePasswordChange}
							disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
						>
							{isChangingPassword ? "Changing Password..." : "Change Password"}
						</Button>
					</div>
				)}
			</section>

			<section className={styles["settings-section"]}>
				<div className={styles["section-header"]}>
					<h3 className={styles["section-heading"]}>Notifications</h3>
					<Badge variant="coming-soon">Coming soon</Badge>
				</div>
				<div className={styles["notification-item"]}>
					<div className={styles["notification-info"]}>
						<span className={styles["notification-label"]}>Push notifications</span>
						<span className={styles["notification-description"]}>Get notified about upcoming tasks</span>
					</div>
					<Switch.Root className={styles["switch"]} disabled aria-label="Push notifications">
						<Switch.Thumb className={styles["switch-thumb"]} />
					</Switch.Root>
				</div>
			</section>

			{handleLogout && (
				<section className={styles["settings-section"]}>
					<h3 className={styles["section-heading"]}>Sign Out</h3>
					<Text size="sm" variant="muted">Sign out of your account</Text>
					<div>
						<Button variant="secondary" onClick={handleLogout}>
							Logout
						</Button>
					</div>
				</section>
			)}
		</div>
	);
}
