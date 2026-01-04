"use client";

import styles from "./DesktopNavigation.module.scss";

import { Button } from "@atoms/Button/Button";
import { ProfileDialog } from "@atoms/ProfileDialog/ProfileDialog";
import { Text } from "@atoms/Text/Text";
import Image from "next/image";

type DesktopNavigationProps = {
	rangeLabel: string;
};

export function DesktopNavigation({ rangeLabel }: DesktopNavigationProps) {
	return (
		<nav className={styles["desktop-navigation"]}>
			<div className={styles["logo-section"]}>
				<div className={styles["logo-text-container"]}>
					<span className={styles["logo-text"]}>
						<span className={styles["logo-text-main"]}>PLANNER</span>
						<span className={styles["logo-text-number"]}>7</span>
					</span>
				</div>
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
