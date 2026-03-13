"use client";

import { Button } from "@atoms/Button/Button";
import { Text } from "@atoms/Text/Text";
import { ImageLibraryDialog } from "@components/ImageLibraryDialog/ImageLibraryDialog";
import { useWeekDisplayPreference } from "@hooks/useWeekDisplayPreference";
import * as Switch from "@radix-ui/react-switch";
import { useState } from "react";

type PreferencesSettingsProps = {
	styles: Record<string, string>;
};

export function PreferencesSettings({ styles }: PreferencesSettingsProps) {
	const {
		showWeekends,
		showEditorToolbar,
		isLoading,
		isSaving,
		setShowWeekends,
		setShowEditorToolbar,
	} = useWeekDisplayPreference();
	const isFiveDayWeek = !showWeekends;
	const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);

	return (
		<div className={styles["tab-content"]}>
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
