"use client";

import styles from "./DesktopNavigation.module.scss";

import { Button } from "@atoms/Button/Button";
import { ProfileDialog } from "@atoms/ProfileDialog/ProfileDialog";
import { Text } from "@atoms/Text/Text";

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
				<ProfileDialog>
					<Button variant="secondary" icon="user" iconSize={36}/>
				</ProfileDialog>
			</div>
		</nav>
	);
}
