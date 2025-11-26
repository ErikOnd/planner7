"use client";

import styles from "./MobileNavigation.module.scss";

import { Text } from "@atoms/Text/Text";
import ThemeToggle from "@atoms/ThemeToggle/ThemeToggle";
import WeeklySlider from "@components/WeeklySlider/WeeklySlider";
import { getCurrentWeek } from "@utils/getCurrentWeek";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

type MobileNavigationProps = {
	content: "weekly" | "remember" | "profile";
	onChangeAction: (value: "weekly" | "remember" | "profile") => void;
	onSelectDateAction: (date: Date) => void;
	selectedDate: Date;
	baseDate: Date;
	setBaseDateAction: (date: Date) => void;
};

const navItems: { value: "weekly" | "remember" | "profile"; label: string }[] = [
	{ value: "weekly", label: "Weekly" },
	{ value: "remember", label: "To Remember" },
	{ value: "profile", label: "Profile" },
];

export function MobileNavigation(props: MobileNavigationProps) {
	const { content, onChangeAction, onSelectDateAction, selectedDate, baseDate, setBaseDateAction } = props;
	const { days, rangeLabel } = getCurrentWeek(baseDate);
	const dayRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);
	const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

	useEffect(() => {
		const index = days.findIndex(({ fullDate }) => fullDate.toDateString() === selectedDate.toDateString());

		const selectedButton = dayRefs.current[index];
		selectedButton?.scrollIntoView({
			behavior: "smooth",
			inline: "center",
		});
	}, [selectedDate, days]);

	useEffect(() => {
		const updateUnderline = () => {
			const container = containerRef.current;
			if (!container) return;

			const active = container.querySelector(`.${styles.active}`) as HTMLElement;
			if (active) {
				setUnderlineStyle({
					left: active.offsetLeft,
					width: active.offsetWidth,
				});
			}
		};

		updateUnderline();
		window.addEventListener("resize", updateUnderline);
		return () => window.removeEventListener("resize", updateUnderline);
	}, [content]);

	return (
		<nav className={styles["mobile-navigation"]}>
			<div className={styles["logo-section"]}>
				<div />
				<Text size="lg" className={styles["logo-text"]}>WeeklyPlanner</Text>
				<div className={styles["theme-toggle-wrapper"]}>
					<ThemeToggle />
				</div>
			</div>
			<div className={styles["slider-section"]} ref={containerRef}>
				{navItems.map(({ value, label }) => (
					<button
						key={value}
						onClick={() => onChangeAction(value)}
						className={clsx(styles["slider-button"], value === content && styles.active)}
					>
						<div className={styles["slider-button-label"]}>{label}</div>
					</button>
				))}
				<div className={styles["slider-underline"]} style={underlineStyle} />
			</div>
			{content === "weekly"
				&& (
					<>
						<div className={styles["date-section"]}>
							<WeeklySlider baseDate={baseDate} rangeLabel={rangeLabel} setBaseDate={setBaseDateAction} />
						</div>
						<div className={styles["calendar-section"]}>
							{days.map(({ label, date, fullDate }, index) => (
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
