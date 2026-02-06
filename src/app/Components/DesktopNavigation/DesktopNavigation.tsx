"use client";

import styles from "./DesktopNavigation.module.scss";

import { Button } from "@atoms/Button/Button";
import { CalendarOverlay } from "@atoms/CalendarOverlay/CalendarOverlay";
import { ProfileDialog } from "@atoms/ProfileDialog/ProfileDialog";
import { Text } from "@atoms/Text/Text";
import Image from "next/image";
import Link from "next/link";

type DesktopNavigationProps = {
	rangeLabel: string;
	onDateSelect: (date: Date) => void;
};

export function DesktopNavigation({ rangeLabel, onDateSelect }: DesktopNavigationProps) {
	return (
		<nav className={styles["desktop-navigation"]}>
			<div className={styles["logo-section"]}>
				<div className={styles["logo-text-container"]}>
					<Image src="/favicon.svg" alt="Planner7 logo" width={64} height={64} className={styles["logo-image"]} />
				</div>
			</div>
			<div className={styles["main-section"]}>
				<Text size="xl" className={styles["header-title"]}>Weekly Overview</Text>
				<Text size="sm" className={styles["current-week"]}>{rangeLabel}</Text>
			</div>
			<div className={styles["actions-section"]}>
				<CalendarOverlay onDateSelect={onDateSelect}>
					<Button variant="secondary" icon="calendar" aria-label="Open calendar" />
				</CalendarOverlay>
				<Link href="/feedback">
					<Button variant="secondary" icon="Megaphone" aria-label="Send feedback" />
				</Link>
				<ProfileDialog>
					<Button variant="secondary" icon="user" iconSize={36} aria-label="Open profile menu" />
				</ProfileDialog>
			</div>
		</nav>
	);
}
