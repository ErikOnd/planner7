"use client";

import { Text } from "@atoms/Text/Text";
import WeeklySlider from "@components/WeeklySlider/WeeklySlider";
import { WorkspaceSwitcher } from "@components/WorkspaceSwitcher/WorkspaceSwitcher";
import { getCurrentWeek } from "@utils/getCurrentWeek";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import styles from "./MobileNavigation.module.scss";

type MobileNavigationProps = {
	content: "weekly" | "remember" | "profile";
	onChangeAction: (value: "weekly" | "remember" | "profile") => void;
	onSelectDateAction: (date: Date) => void;
	selectedDate: Date;
	baseDate: Date;
	setBaseDateAction: (date: Date) => void;
	showWeekends?: boolean;
};

const navItems: { value: "weekly" | "remember" | "profile"; label: string }[] = [
	{ value: "weekly", label: "Weekly" },
	{ value: "remember", label: "Backlog" },
	{ value: "profile", label: "Profile" },
];

export function MobileNavigation(props: MobileNavigationProps) {
	const {
		content,
		onChangeAction,
		onSelectDateAction,
		selectedDate,
		baseDate,
		setBaseDateAction,
		showWeekends = true,
	} = props;
	const { days, rangeLabel } = getCurrentWeek(baseDate);
	const visibleDays = showWeekends
		? days
		: days.filter(({ fullDate }) => {
			const dayIndex = fullDate.getDay();
			return dayIndex >= 1 && dayIndex <= 5;
		});
	const dayRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);
	const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

	useEffect(() => {
		dayRefs.current = [];
	}, [showWeekends, baseDate]);

	useEffect(() => {
		const index = visibleDays.findIndex(({ fullDate }) => fullDate.toDateString() === selectedDate.toDateString());

		const selectedButton = dayRefs.current[index];
		selectedButton?.scrollIntoView({
			behavior: "smooth",
			inline: "center",
		});
	}, [selectedDate, visibleDays]);

	useEffect(() => {
		const updateUnderline = () => {
			const container = containerRef.current;
			if (!container) return;

			const active = container.querySelector(`.${styles.active}`) as HTMLElement;
			if (active) {
				const containerRect = container.getBoundingClientRect();
				const activeRect = active.getBoundingClientRect();
				setUnderlineStyle({
					left: activeRect.left - containerRect.left,
					width: activeRect.width,
				});
			}
		};

		updateUnderline();
		window.addEventListener("resize", updateUnderline);
		return () => window.removeEventListener("resize", updateUnderline);
	}, [content]);

	return (
		<nav className={styles["mobile-navigation"]}>
			<div className={styles["slider-section"]} ref={containerRef}>
				<div className={styles["slider-tabs"]}>
					{navItems.map(({ value, label }) => (
						<button
							key={value}
							onClick={() => onChangeAction(value)}
							className={clsx(styles["slider-button"], value === content && styles.active)}
						>
							<div className={styles["slider-button-label"]}>{label}</div>
						</button>
					))}
					<WorkspaceSwitcher variant="tab" />
				</div>
				<div className={styles["slider-underline"]} style={underlineStyle} />
			</div>
			{content === "weekly"
				&& (
					<>
						<div className={styles["date-section"]}>
							<WeeklySlider baseDate={baseDate} rangeLabel={rangeLabel} setBaseDate={setBaseDateAction} />
						</div>
						<div className={styles["calendar-section"]}>
							{visibleDays.map(({ label, date, fullDate }, index) => (
								<button
									key={index}
									ref={(el) => {
										dayRefs.current[index] = el;
									}}
									className={clsx(
										styles["day-button"],
										fullDate.toDateString() === selectedDate.toDateString() && styles["active-day"],
									)}
									onClick={() => {
										onSelectDateAction(fullDate);
									}}
								>
									<Text>{label}</Text>
									<Text className={styles["day-date"]}>{date}</Text>
								</button>
							))}
						</div>
					</>
				)}
		</nav>
	);
}
