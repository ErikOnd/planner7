"use client";

import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@atoms/Button/Button";
import { Text } from "@atoms/Text/Text";
import { ImageLibraryDialog } from "@components/ImageLibraryDialog/ImageLibraryDialog";
import { useWeekDisplayPreference } from "@hooks/useWeekDisplayPreference";
import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { getDailyGreetingDisabledKey } from "../../constants/dailyGreeting";

type PreferencesSettingsProps = {
	theme: "light" | "dark" | "system";
	setTheme: (theme: "light" | "dark" | "system") => void;
	styles: Record<string, string>;
};

export function PreferencesSettings({ theme, setTheme, styles }: PreferencesSettingsProps) {
	const { profile } = useProfile();
	const {
		showWeekends,
		showEditorToolbar,
		isLoading,
		isSaving,
		setShowWeekends,
		setShowEditorToolbar,
	} = useWeekDisplayPreference();
	const isFiveDayWeek = !showWeekends;
	const [showDailyVoiceWelcome, setShowDailyVoiceWelcome] = useState(true);
	const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !profile) return;
		const disabledKey = getDailyGreetingDisabledKey(profile.email);
		const isDisabled = window.localStorage.getItem(disabledKey) === "true";
		setShowDailyVoiceWelcome(!isDisabled);
	}, [profile]);

	const handleDailyVoiceWelcomeToggle = (checked: boolean) => {
		setShowDailyVoiceWelcome(checked);
		if (typeof window === "undefined" || !profile) return;
		const disabledKey = getDailyGreetingDisabledKey(profile.email);
		if (checked) {
			window.localStorage.removeItem(disabledKey);
			return;
		}
		window.localStorage.setItem(disabledKey, "true");
	};

	return (
		<div className={styles["tab-content"]}>
			<section className={styles["settings-section"]}>
				<h3 className={styles["section-heading"]}>Appearance</h3>
				<Text size="sm" variant="muted">Color mode</Text>
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

			<section className={styles["settings-section"]}>
				<div className={styles["section-header"]}>
					<h3 className={styles["section-heading"]}>Week Display</h3>
				</div>
				<Text size="sm" variant="muted">Choose which days to display in your weekly planner</Text>
				<div className={styles["notification-item"]}>
					<div className={styles["notification-info"]}>
						<span className={styles["notification-label"]}>5-day week (Mon-Fri)</span>
						<span className={styles["notification-description"]}>Show only weekdays</span>
					</div>
					<Switch.Root
						className={styles["switch"]}
						checked={isFiveDayWeek}
						onCheckedChange={(checked) => setShowWeekends(!checked)}
						disabled={isLoading || isSaving}
						aria-label="5-day week"
					>
						<Switch.Thumb className={styles["switch-thumb"]} />
					</Switch.Root>
				</div>
			</section>

			<section className={styles["settings-section"]}>
				<div className={styles["section-header"]}>
					<h3 className={styles["section-heading"]}>Rich Text Editor</h3>
				</div>
				<Text size="sm" variant="muted">Customize your text editor experience</Text>
				<div className={styles["notification-item"]}>
					<div className={styles["notification-info"]}>
						<span className={styles["notification-label"]}>Show toolbar</span>
						<span className={styles["notification-description"]}>Display formatting controls above notes</span>
					</div>
					<Switch.Root
						className={styles["switch"]}
						checked={showEditorToolbar}
						onCheckedChange={setShowEditorToolbar}
						disabled={isLoading || isSaving}
						aria-label="Show rich text toolbar"
					>
						<Switch.Thumb className={styles["switch-thumb"]} />
					</Switch.Root>
				</div>
				<div className={styles["notification-item"]}>
					<div className={styles["notification-info"]}>
						<span className={styles["notification-label"]}>Show daily voice welcome</span>
						<span className={styles["notification-description"]}>
							Show the morning/afternoon voice-notes popup when opening Planner
						</span>
					</div>
					<Switch.Root
						className={styles["switch"]}
						checked={showDailyVoiceWelcome}
						onCheckedChange={handleDailyVoiceWelcomeToggle}
						aria-label="Show daily voice welcome popup"
					>
						<Switch.Thumb className={styles["switch-thumb"]} />
					</Switch.Root>
				</div>
			</section>

			<section className={styles["settings-section"]}>
				<div className={styles["section-header"]}>
					<h3 className={styles["section-heading"]}>Image Storage</h3>
				</div>
				<Text size="sm" variant="muted">
					View all uploaded images and delete any image to free storage space.
				</Text>
				<Button
					type="button"
					variant="secondary"
					icon="settings"
					iconSize={16}
					onClick={() => setIsImageLibraryOpen(true)}
				>
					Manage uploaded images
				</Button>
			</section>

			<ImageLibraryDialog
				open={isImageLibraryOpen}
				onOpenChange={setIsImageLibraryOpen}
				showLimitNotice={false}
			/>
		</div>
	);
}
