"use client";

import { Badge } from "@atoms/Badge/Badge";
import { Text } from "@atoms/Text/Text";
import { useWeekDisplayPreference } from "@hooks/useWeekDisplayPreference";
import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";

type PreferencesSettingsProps = {
	theme: "light" | "dark" | "system";
	setTheme: (theme: "light" | "dark" | "system") => void;
	styles: Record<string, string>;
};

export function PreferencesSettings({ theme, setTheme, styles }: PreferencesSettingsProps) {
	const { showWeekends, isLoading, isSaving, setShowWeekends } = useWeekDisplayPreference();
	const isFiveDayWeek = !showWeekends;

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
					<Badge variant="coming-soon">Coming soon</Badge>
				</div>
				<Text size="sm" variant="muted">Customize your text editor experience</Text>
				<div className={clsx(styles["notification-item"], styles["notification-item--disabled"])}>
					<div className={styles["notification-info"]}>
						<span className={styles["notification-label"]}>Show toolbar</span>
						<span className={styles["notification-description"]}>Display formatting options in the editor</span>
					</div>
					<Switch.Root className={styles["switch"]} disabled aria-label="Show toolbar">
						<Switch.Thumb className={styles["switch-thumb"]} />
					</Switch.Root>
				</div>
			</section>
		</div>
	);
}
