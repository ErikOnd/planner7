"use client";

import { Badge } from "@atoms/Badge/Badge";
import { Button } from "@atoms/Button/Button";
import { Text } from "@atoms/Text/Text";
import {
	Messages,
	PasswordFormData,
	ProfileActions,
	ProfileData,
	ProfileFormData,
	UIState,
} from "@hooks/useProfileSettings";
import * as Switch from "@radix-ui/react-switch";

type GeneralSettingsProps = {
	originalProfile: ProfileData | null;
	profileForm: ProfileFormData;
	passwordForm: PasswordFormData;
	uiState: UIState;
	messages: Messages;
	actions: ProfileActions;
	handleLogout?: () => Promise<void>;
	styles: Record<string, string>;
};

export function GeneralSettings({
	originalProfile,
	profileForm,
	passwordForm,
	uiState,
	messages,
	actions,
	handleLogout,
	styles,
}: GeneralSettingsProps) {
	return (
		<div className={styles["tab-content"]}>
			<section className={styles["settings-section"]}>
				<h3 className={styles["section-heading"]}>Profile</h3>
				{messages.error && <div className={styles["error-message"]}>{messages.error}</div>}
				{messages.successMessage && <div className={styles["success-message"]}>{messages.successMessage}</div>}
				<div className={styles["form-group"]}>
					<label className={styles["form-label"]} htmlFor="name">Name</label>
					<input
						type="text"
						id="name"
						className={styles["form-input"]}
						placeholder="Enter your name"
						value={profileForm.displayName}
						onChange={(e) => profileForm.setDisplayName(e.target.value)}
						disabled={uiState.isLoading || uiState.isSaving}
					/>
				</div>
				<div className={styles["form-group"]}>
					<label className={styles["form-label"]} htmlFor="email">Email</label>
					<input
						type="email"
						id="email"
						className={styles["form-input"]}
						placeholder="Enter your email"
						value={profileForm.email}
						onChange={(e) => profileForm.setEmail(e.target.value)}
						disabled={uiState.isLoading || uiState.isSaving}
					/>
					{originalProfile?.pendingEmail && (
						<div className={styles["pending-email-notice"]}>
							<span className={styles["pending-email-label"]}>Pending confirmation:</span>{" "}
							<span className={styles["pending-email-value"]}>{originalProfile.pendingEmail}</span>
						</div>
					)}
				</div>
				{actions.hasChanges && (
					<div className={styles["save-button-container"]}>
						<Button
							variant="primary"
							onClick={actions.handleSave}
							disabled={uiState.isSaving}
						>
							{uiState.isSaving ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				)}
			</section>

			<section className={styles["settings-section"]}>
				<h3 className={styles["section-heading"]}>Password</h3>
				{messages.passwordError && <div className={styles["error-message"]}>{messages.passwordError}</div>}
				{messages.passwordSuccessMessage && (
					<div className={styles["success-message"]}>{messages.passwordSuccessMessage}</div>
				)}
				<div className={styles["form-group"]}>
					<label className={styles["form-label"]} htmlFor="currentPassword">Current Password</label>
					<input
						type="password"
						id="currentPassword"
						className={styles["form-input"]}
						placeholder="Enter your current password"
						value={passwordForm.currentPassword}
						onChange={(e) => passwordForm.setCurrentPassword(e.target.value)}
						disabled={uiState.isLoading || uiState.isChangingPassword}
					/>
				</div>
				<div className={styles["form-group"]}>
					<label className={styles["form-label"]} htmlFor="newPassword">New Password</label>
					<input
						type="password"
						id="newPassword"
						className={styles["form-input"]}
						placeholder="Enter your new password"
						value={passwordForm.newPassword}
						onChange={(e) => passwordForm.setNewPassword(e.target.value)}
						disabled={uiState.isLoading || uiState.isChangingPassword}
					/>
				</div>
				<div className={styles["form-group"]}>
					<label className={styles["form-label"]} htmlFor="confirmPassword">Confirm New Password</label>
					<input
						type="password"
						id="confirmPassword"
						className={styles["form-input"]}
						placeholder="Confirm your new password"
						value={passwordForm.confirmPassword}
						onChange={(e) => passwordForm.setConfirmPassword(e.target.value)}
						disabled={uiState.isLoading || uiState.isChangingPassword}
					/>
				</div>
				{(passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword) && (
					<div className={styles["save-button-container"]}>
						<Button
							variant="primary"
							onClick={actions.handlePasswordChange}
							disabled={
								uiState.isChangingPassword
								|| !passwordForm.currentPassword
								|| !passwordForm.newPassword
								|| !passwordForm.confirmPassword
							}
						>
							{uiState.isChangingPassword ? "Changing Password..." : "Change Password"}
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
