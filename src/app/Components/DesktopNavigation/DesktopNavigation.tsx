"use client";

import styles from "./DesktopNavigation.module.scss";

import { Button } from "@atoms/Button/Button";
import { CalendarOverlay } from "@atoms/CalendarOverlay/CalendarOverlay";
import { ProfileDialog } from "@atoms/ProfileDialog/ProfileDialog";
import { Text } from "@atoms/Text/Text";
import Image from "next/image";

type DesktopNavigationProps = {
	rangeLabel: string;
	onDateSelect: (date: Date) => void;
};

export function DesktopNavigation({ rangeLabel, onDateSelect }: DesktopNavigationProps) {
	return (
		<nav className={styles["desktop-navigation"]}>
			<div className={styles["logo-section"]}>
				<div className={styles["logo-text-container"]}>
					<span className={styles["logo-text"]}>
						<span className={styles["logo-text-main"]}>PLANNER</span>
						<span className={styles["logo-text-number"]}>7</span>
					</span>
				</div>
				<CalendarOverlay onDateSelect={onDateSelect}>
					<Button variant="secondary" icon="calendar" aria-label="Open calendar" />
				</CalendarOverlay>
			</div>
			<div className={styles["main-section"]}>
				<Text size="xl">Weekly Overview</Text>
				<Text size="lg" className={styles["current-week"]}>{rangeLabel}</Text>
			</div>
			<div className={styles["actions-section"]}>
				<ProfileDialog>
					<Button variant="secondary" icon="user" iconSize={36} aria-label="Open profile menu" />
				</ProfileDialog>
			</div>
		</nav>
	);
}
