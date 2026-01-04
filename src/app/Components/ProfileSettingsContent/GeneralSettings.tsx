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
	isLoading: boolean;
	isSaving: boolean;
	error: string | null;
	successMessage: string | null;
	hasChanges: boolean;
	handleSave: () => Promise<void>;
	handleLogout?: () => Promise<void>;
	styles: Record<string, string>;
};

export function GeneralSettings({
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
