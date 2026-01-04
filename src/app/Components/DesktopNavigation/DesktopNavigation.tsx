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
				<Image
					src="/icon-192.png"
					alt="Planner7"
					width={50}
					height={50}
					className={styles["logo-image"]}
				/>
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
