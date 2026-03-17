"use client";

import { Badge } from "@atoms/Badge/Badge";
import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import { ImageLibraryDialog } from "@components/ImageLibraryDialog/ImageLibraryDialog";
import { useWeekDisplayPreference } from "@hooks/useWeekDisplayPreference";
import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";
import { useState } from "react";

type PreferencesSettingsProps = {
	styles: Record<string, string>;
};

export function PreferencesSettings({ styles }: PreferencesSettingsProps) {
	const sectionIconSize = 24;

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
	const appearanceOptions = [
		{ id: "light", label: "Light", isSelected: true, showPanel: true, showSecondaryBar: false },
		{ id: "system", label: "System", isSelected: false, showPanel: true, showSecondaryBar: true },
		{ id: "dark", label: "Dark", isSelected: false, showPanel: true, showSecondaryBar: false },
	] as const;

	return (
		<div className={clsx(styles["tab-content"], styles["preferences-layout"])}>
			<section className={clsx(styles["settings-section"], styles["preference-feature-card"])}>
				<div className={styles["section-header"]}>
					<div className={styles["section-title-group"]}>
						<span className={styles["section-icon"]}>
							<Icon name="palette" size={sectionIconSize} className={styles["section-icon-glyph"]} />
						</span>
						<div className={styles["section-title-stack"]}>
							<h3 className={styles["section-heading"]}>Appearance</h3>
						</div>
					</div>
					<Badge variant="coming-soon">Coming soon</Badge>
				</div>
				<div className={styles["section-content"]}>
					<span className={styles["preference-group-label"]}>Color mode</span>
					<div className={styles["appearance-options"]} role="list" aria-label="Appearance mode previews">
						{appearanceOptions.map((option) => (
							<div
								key={option.id}
								role="listitem"
								className={clsx(
									styles["appearance-option"],
									option.isSelected && styles["appearance-option--selected"],
								)}
								aria-current={option.isSelected ? "true" : undefined}
							>
								<div
									className={clsx(
										styles["appearance-preview"],
										styles[`appearance-preview--${option.id}`],
									)}
									aria-hidden="true"
								>
									<span className={styles["appearance-preview-bar"]} />
									{option.showSecondaryBar && (
										<span
											className={clsx(
												styles["appearance-preview-bar"],
												styles["appearance-preview-bar--secondary"],
											)}
										/>
									)}
									{option.showPanel && <span className={styles["appearance-preview-panel"]} />}
								</div>
								<span className={styles["appearance-option-label"]}>{option.label}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			<div className={styles["preferences-card-grid"]}>
				<section className={clsx(styles["settings-section"], styles["preference-option-card"])}>
					<div className={styles["preference-option-card-body"]}>
						<span className={styles["preference-card-icon"]}>
							<Icon name="calendar-range" size={sectionIconSize} className={styles["section-icon-glyph"]} />
						</span>
						<div className={styles["preference-option-copy"]}>
							<h3 className={styles["section-heading"]}>Week Display</h3>
							<p className={styles["section-description"]}>
								Show only weekdays (Mon-Fri) in your weekly planner.
							</p>
						</div>
						<div className={styles["preference-toggle-stack"]}>
							<Switch.Root
								className={styles["switch"]}
								checked={isFiveDayWeek}
								onCheckedChange={(checked) => setShowWeekends(!checked)}
								disabled={isLoading || isSaving}
								aria-label="5-day week"
							>
								<Switch.Thumb className={styles["switch-thumb"]} />
							</Switch.Root>
							<span className={styles["preference-toggle-label"]}>5-day week</span>
						</div>
					</div>
				</section>

				<section className={clsx(styles["settings-section"], styles["preference-option-card"])}>
					<div className={styles["preference-option-card-body"]}>
						<span className={styles["preference-card-icon"]}>
							<Icon name="pencil-line" size={sectionIconSize} className={styles["section-icon-glyph"]} />
						</span>
						<div className={styles["preference-option-copy"]}>
							<h3 className={styles["section-heading"]}>Rich Text Editor</h3>
							<p className={styles["section-description"]}>
								Display formatting controls above your notes.
							</p>
						</div>
						<div className={styles["preference-toggle-stack"]}>
							<Switch.Root
								className={styles["switch"]}
								checked={showEditorToolbar}
								onCheckedChange={setShowEditorToolbar}
								disabled={isLoading || isSaving}
								aria-label="Show rich text toolbar"
							>
								<Switch.Thumb className={styles["switch-thumb"]} />
							</Switch.Root>
							<span className={styles["preference-toggle-label"]}>Show toolbar</span>
						</div>
					</div>
				</section>
			</div>

			<section className={styles["settings-section"]}>
				<div className={styles["section-card-header"]}>
					<div className={styles["section-title-group"]}>
						<span className={styles["section-icon"]}>
							<Icon name="image" size={sectionIconSize} className={styles["section-icon-glyph"]} />
						</span>
						<div className={styles["section-title-stack"]}>
							<h3 className={styles["section-heading"]}>Image Storage</h3>
							<p className={styles["section-description"]}>
								View uploaded images and free storage by removing what you no longer need.
							</p>
						</div>
					</div>
				</div>
				<div className={styles["section-content"]}>
					<div className={`${styles["form-actions"]} ${styles["form-actions--center"]}`}>
						<Button
							type="button"
							variant="secondary"
							icon="settings"
							iconSize={16}
							onClick={() => setIsImageLibraryOpen(true)}
						>
							Manage uploaded images
						</Button>
					</div>
				</div>
			</section>

			<ImageLibraryDialog
				open={isImageLibraryOpen}
				onOpenChange={setIsImageLibraryOpen}
				showLimitNotice={false}
			/>
		</div>
	);
}
