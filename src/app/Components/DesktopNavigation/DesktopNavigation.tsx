"use client";

import styles from "./DesktopNavigation.module.scss";

import { Button } from "@atoms/Button/Button";
import { CalendarOverlay } from "@atoms/CalendarOverlay/CalendarOverlay";
import { ProfileDialog } from "@atoms/ProfileDialog/ProfileDialog";
import { Text } from "@atoms/Text/Text";

type DesktopNavigationProps = {
	rangeLabel: string;
	onDateSelect: (date: Date) => void;
	baseDate: Date;
	setBaseDateAction: (date: Date) => void;
};

export function DesktopNavigation({ rangeLabel, onDateSelect, baseDate, setBaseDateAction }: DesktopNavigationProps) {
	const handleWeekChange = (direction: -1 | 1) => {
		const next = new Date(baseDate);
		next.setDate(baseDate.getDate() + direction * 7);
		setBaseDateAction(next);
	};

	return (
		<nav className={styles["desktop-navigation"]}>
			<div className={styles["date-section"]}>
				<Button
					variant="secondary"
					icon="chevron-left"
					aria-label="Previous week"
					onClick={() => handleWeekChange(-1)}
				/>
				<div className={styles["date-info"]}>
					<div className={styles["date-row"]}>
						<Text size="xl" className={styles["date-range"]}>{rangeLabel}</Text>
					</div>
				</div>
				<Button
					variant="secondary"
					icon="chevron-right"
					aria-label="Next week"
					onClick={() => handleWeekChange(1)}
				/>
			</div>
			<div className={styles["actions-section"]}>
				<CalendarOverlay onDateSelect={onDateSelect}>
					<Button variant="secondary" icon="calendar" aria-label="Open calendar" />
				</CalendarOverlay>
				<Button
					href="/feedback"
					variant="secondary"
					icon="Megaphone"
					aria-label="Send feedback"
				/>
				<ProfileDialog>
					<Button variant="secondary" icon="user" iconSize={36} aria-label="Open profile menu" />
				</ProfileDialog>
			</div>
		</nav>
	);
}
