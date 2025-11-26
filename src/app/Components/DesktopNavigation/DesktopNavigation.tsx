"use client";

import styles from "./DesktopNavigation.module.scss";

import { Text } from "@atoms/Text/Text";
import ThemeToggle from "@atoms/ThemeToggle/ThemeToggle";

type DesktopNavigationProps = {
	rangeLabel: string;
};

export function DesktopNavigation({ rangeLabel }: DesktopNavigationProps) {
	return (
		<nav className={styles["desktop-navigation"]}>
			<div className={styles["logo-section"]}>
				<Text size="xl" className={styles["logo-text"]}>WeeklyPlanner</Text>
			</div>
			<div className={styles["main-section"]}>
				<Text size="xl">Weekly Overview</Text>
				<Text size="lg" className={styles["current-week"]}>{rangeLabel}</Text>
			</div>
			<div className={styles["actions-section"]}>
				<ThemeToggle />
			</div>
		</nav>
	);
}
