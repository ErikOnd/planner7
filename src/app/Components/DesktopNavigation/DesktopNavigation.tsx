"use client";

import styles from "./DesktopNavigation.module.scss";

import { Button } from "@atoms/Button/Button";
import { CalendarOverlay } from "@atoms/CalendarOverlay/CalendarOverlay";
import { ProfileDialog } from "@atoms/ProfileDialog/ProfileDialog";
import { Text } from "@atoms/Text/Text";
import { FeedbackDialog } from "@components/FeedbackDialog/FeedbackDialog";

type DesktopNavigationProps = {
	rangeLabel: string;
	onDateSelect: (date: Date) => void;
	activeDate: Date;
	baseDate: Date;
	setBaseDateAction: (date: Date) => void;
	showWeekends: boolean;
};

export function DesktopNavigation({
	rangeLabel,
	onDateSelect,
	activeDate,
	baseDate,
	setBaseDateAction,
	showWeekends,
}: DesktopNavigationProps) {
	const handleWeekChange = (direction: -1 | 1) => {
		const next = new Date(baseDate);
		next.setDate(baseDate.getDate() + direction * 7);
		setBaseDateAction(next);
	};

	return (
		<nav className={styles["desktop-navigation"]}>
			<div className={styles["date-section"]}>
				<Button
					variant="ghost"
					icon="chevron-left"
					iconSize={28}
					className={`${styles["nav-control"]} ${styles["nav-arrow"]}`}
					aria-label="Previous week"
					onClick={() => handleWeekChange(-1)}
				/>
				<Button
					variant="ghost"
					icon="chevron-right"
					iconSize={28}
					className={`${styles["nav-control"]} ${styles["nav-arrow"]}`}
					aria-label="Next week"
					onClick={() => handleWeekChange(1)}
				/>
				<div className={styles["date-info"]}>
					<div className={styles["date-row"]}>
						<Text size="xl" className={styles["date-range"]}>{rangeLabel}</Text>
					</div>
				</div>
			</div>
			<div className={styles["actions-section"]}>
				<FeedbackDialog>
					<Button
						variant="ghost"
						icon="Megaphone"
						iconSize={28}
						className={`${styles["nav-control"]} ${styles["nav-action"]}`}
						aria-label="Send feedback"
					/>
				</FeedbackDialog>
				<CalendarOverlay onDateSelect={onDateSelect} activeDate={activeDate} showWeekends={showWeekends}>
					<Button
						variant="ghost"
						icon="calendar"
						iconSize={28}
						className={`${styles["nav-control"]} ${styles["nav-action"]}`}
						aria-label="Open calendar"
					/>
				</CalendarOverlay>
				<ProfileDialog>
					<Button
						variant="ghost"
						icon="settings"
						iconSize={28}
						className={`${styles["nav-control"]} ${styles["nav-action"]}`}
						aria-label="Open profile menu"
					/>
				</ProfileDialog>
			</div>
		</nav>
	);
}
