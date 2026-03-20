"use client";

import { Badge } from "@atoms/Badge/Badge";
import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import {
	Messages,
	PasswordFormData,
	ProfileActions,
	ProfileData,
	ProfileFormData,
	UIState,
} from "@hooks/useProfileSettings";
import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";
import { useState } from "react";

const DELETE_CONFIRMATION_TEXT = "DELETE MY ACCOUNT";

type GeneralSettingsProps = {
	originalProfile: ProfileData | null;
	profileForm: ProfileFormData;
	passwordForm: PasswordFormData;
	uiState: UIState;
	messages: Messages;
	actions: ProfileActions;
	handleLogout?: () => Promise<void>;
	handleAccountDeleted?: () => Promise<void>;
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
	handleAccountDeleted,
	styles,
}: GeneralSettingsProps) {
	const sectionIconSize = 24;
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleConfirmDelete = async () => {
		if (deleteConfirmationInput.trim().toUpperCase() !== DELETE_CONFIRMATION_TEXT) {
			setDeleteError(`Type "${DELETE_CONFIRMATION_TEXT}" to confirm.`);
			return;
		}

		setDeleteError(null);
		const result = await actions.handleDeleteAccount();
		if (result.success) {
			if (handleAccountDeleted) {
				await handleAccountDeleted();
			}
			setIsDeleteDialogOpen(false);
			return;
		}
		setDeleteError(result.error || "Failed to delete account.");
	};

	const handleLogoutClick = async () => {
		if (!handleLogout) return;

		setIsLoggingOut(true);
		try {
			await handleLogout();
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<div className={styles["tab-content"]}>
			<div className={styles["mobile-section-block"]}>
				<div className={styles["mobile-section-label"]}>Profile</div>
				<section className={clsx(styles["settings-section"], styles["settings-section--mobile-compact"])}>
					<div className={styles["section-card-header"]}>
						<div className={`${styles["section-title-group"]} ${styles["section-title-group--centered"]}`}>
							<span className={styles["section-icon"]}>
								<Icon name="circle-user-round" size={sectionIconSize} className={styles["section-icon-glyph"]} />
							</span>
							<div className={styles["section-title-stack"]}>
								<h3 className={styles["section-heading"]}>Profile</h3>
							</div>
						</div>
					</div>
					<div className={styles["section-content"]}>
						{messages.error && <div className={styles["error-message"]}>{messages.error}</div>}
						{messages.successMessage && <div className={styles["success-message"]}>{messages.successMessage}</div>}
						<div className={styles["form-grid"]}>
							<div className={styles["form-group"]}>
								<label className={styles["form-label"]} htmlFor="name">Full Name</label>
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
								<label className={styles["form-label"]} htmlFor="email">Email Address</label>
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
						</div>
						{actions.hasChanges && (
							<div className={styles["form-actions"]}>
								<Button
									variant="primary"
									size="lg"
									onClick={actions.handleSave}
									disabled={uiState.isSaving}
								>
									{uiState.isSaving ? "Saving..." : "Save Changes"}
								</Button>
							</div>
						)}
					</div>
				</section>
			</div>

			<div className={styles["mobile-section-block"]}>
				<div className={styles["mobile-section-label"]}>Security</div>
				<section className={clsx(styles["settings-section"], styles["settings-section--mobile-compact"])}>
					<div className={styles["section-card-header"]}>
						<div className={`${styles["section-title-group"]} ${styles["section-title-group--centered"]}`}>
							<span className={styles["section-icon"]}>
								<Icon name="lock-keyhole" size={sectionIconSize} className={styles["section-icon-glyph"]} />
							</span>
							<div className={styles["section-title-stack"]}>
								<h3 className={styles["section-heading"]}>Password</h3>
							</div>
						</div>
					</div>
					<div className={styles["section-content"]}>
						{messages.passwordError && <div className={styles["error-message"]}>{messages.passwordError}</div>}
						{messages.passwordSuccessMessage && (
							<div className={styles["success-message"]}>{messages.passwordSuccessMessage}</div>
						)}
						<div className={styles["form-grid"]}>
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
							<div className={`${styles["form-grid"]} ${styles["form-grid--split"]}`}>
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
							</div>
						</div>
						<div className={styles["form-actions"]}>
							<Button
								variant="primary"
								size="lg"
								onClick={actions.handlePasswordChange}
								disabled={uiState.isChangingPassword
									|| !passwordForm.currentPassword
									|| !passwordForm.newPassword
									|| !passwordForm.confirmPassword}
								className={styles["mobile-primary-cta"]}
							>
								{uiState.isChangingPassword ? "Changing Password..." : "Change Password"}
							</Button>
						</div>
					</div>
				</section>
			</div>

			<div className={styles["mobile-section-block"]}>
				<div className={styles["mobile-section-label"]}>Notifications</div>
				<section className={clsx(styles["settings-section"], styles["settings-section--mobile-compact"])}>
					<div className={styles["section-header"]}>
						<div className={styles["section-title-group"]}>
							<span className={styles["section-icon"]}>
								<Icon name="bell" size={sectionIconSize} className={styles["section-icon-glyph"]} />
							</span>
							<div className={styles["section-title-stack"]}>
								<h3 className={styles["section-heading"]}>Notifications</h3>
								<p className={styles["section-description"]}>Control how Planner7 alerts you about upcoming work.</p>
							</div>
						</div>
						<Badge variant="coming-soon">Coming soon</Badge>
					</div>
					<div className={styles["section-content"]}>
						<div className={styles["notification-item"]}>
							<div className={styles["notification-info"]}>
								<div className={styles["notification-label-row"]}>
									<span className={styles["notification-label"]}>Push notifications</span>
									<Badge variant="coming-soon" className={styles["notification-badge-mobile"]}>
										Coming Soon
									</Badge>
								</div>
								<span className={styles["notification-description"]}>Receive alerts on your mobile device</span>
							</div>
							<Switch.Root className={styles["switch"]} disabled aria-label="Push notifications">
								<Switch.Thumb className={styles["switch-thumb"]} />
							</Switch.Root>
						</div>
					</div>
				</section>
			</div>

			{handleLogout && (
				<div className={styles["mobile-section-block"]}>
					<div className={styles["mobile-section-label"]}>Sign Out</div>
					<section className={clsx(styles["settings-section"], styles["settings-section--mobile-compact"])}>
						<div className={styles["section-card-header"]}>
							<div className={styles["section-title-group"]}>
								<span className={styles["section-icon"]}>
									<Icon name="log-out" size={sectionIconSize} className={styles["section-icon-glyph"]} />
								</span>
								<div className={styles["section-title-stack"]}>
									<h3 className={styles["section-heading"]}>Sign Out</h3>
									<p className={styles["section-description"]}>End your current Planner7 session on this device.</p>
								</div>
							</div>
						</div>
						<div className={styles["section-content"]}>
							<p className={styles["mobile-card-note"]}>Sign out of your account</p>
							<div className={`${styles["form-actions"]} ${styles["form-actions--start"]}`}>
								<Button
									variant="primary"
									size="lg"
									disabled={isLoggingOut}
									onClick={handleLogoutClick}
									className={styles["mobile-primary-cta"]}
								>
									{isLoggingOut ? "Logging out..." : "Logout"}
								</Button>
							</div>
						</div>
					</section>
				</div>
			)}

			<div className={styles["mobile-section-block"]}>
				<div className={styles["mobile-section-label"]}>Delete Account</div>
				<section className={clsx(styles["settings-section"], styles["settings-section--mobile-compact"])}>
					<div className={styles["section-card-header"]}>
						<div className={styles["section-title-group"]}>
							<span className={`${styles["section-icon"]} ${styles["section-icon--danger"]}`}>
								<Icon name="trash" size={sectionIconSize} className={styles["section-icon-glyph"]} />
							</span>
							<div className={styles["section-title-stack"]}>
								<h3 className={styles["section-heading"]}>Delete Account</h3>
								<p className={styles["section-description"]}>
									Permanently delete your profile, workspaces, notes, and todos. This cannot be recovered.
								</p>
							</div>
						</div>
					</div>
					<div className={styles["section-content"]}>
						<p className={styles["mobile-card-note"]}>
							Permanently delete your profile, workspaces, notes, and todos. This cannot be recovered.
						</p>
						{!isDeleteDialogOpen && (
							<div className={`${styles["form-actions"]} ${styles["form-actions--start"]}`}>
								<Button
									variant="danger"
									size="lg"
									onClick={() => {
										setDeleteConfirmationInput("");
										setDeleteError(null);
										setIsDeleteDialogOpen(true);
									}}
									disabled={uiState.isDeletingAccount}
									className={styles["mobile-danger-cta"]}
								>
									{uiState.isDeletingAccount ? "Deleting..." : "Delete account"}
								</Button>
							</div>
						)}
						{isDeleteDialogOpen && (
							<>
								<p className={styles["delete-account-description"]}>
									Type {DELETE_CONFIRMATION_TEXT} to confirm permanent deletion.
								</p>
								<div className={styles["form-group"]}>
									<input
										id="delete-account-confirmation-input"
										type="text"
										className={`${styles["form-input"]} ${styles["delete-account-input"]}`}
										placeholder={DELETE_CONFIRMATION_TEXT}
										value={deleteConfirmationInput}
										onChange={(event) => setDeleteConfirmationInput(event.target.value)}
										disabled={uiState.isDeletingAccount}
										autoFocus
									/>
								</div>
								{deleteError && <div className={styles["error-message"]}>{deleteError}</div>}
								<div className={styles["delete-account-actions"]}>
									<Button
										variant="secondary"
										size="lg"
										disabled={uiState.isDeletingAccount}
										onClick={() => setIsDeleteDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button
										variant="danger"
										size="lg"
										onClick={() => {
											void handleConfirmDelete();
										}}
										disabled={uiState.isDeletingAccount
											|| deleteConfirmationInput.trim().toUpperCase() !== DELETE_CONFIRMATION_TEXT}
										className={styles["delete-account-confirm"]}
									>
										{uiState.isDeletingAccount ? "Deleting..." : "Delete account"}
									</Button>
								</div>
							</>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
