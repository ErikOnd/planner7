"use client";

import { Button } from "@atoms/Button/Button";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { useState } from "react";
import styles from "./CalendarOverlay.module.scss";

type CalendarOverlayProps = {
	children: React.ReactNode;
	onDateSelect: (date: Date) => void;
};

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarOverlay({ children, onDateSelect }: CalendarOverlayProps) {
	const [open, setOpen] = useState(false);
	const now = new Date();
	const [currentMonth, setCurrentMonth] = useState(now.getMonth());
	const [currentYear, setCurrentYear] = useState(now.getFullYear());

	const getDaysInMonth = (month: number, year: number) => {
		return new Date(year, month + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (month: number, year: number) => {
		const day = new Date(year, month, 1).getDay();
		// Convert Sunday (0) to 7, and shift so Monday is 1
		return day === 0 ? 6 : day - 1;
	};

	const handleDateClick = (day: number) => {
		const selectedDate = new Date(currentYear, currentMonth, day);
		onDateSelect(selectedDate);
		setOpen(false);
	};

	const handlePreviousMonth = () => {
		if (currentMonth === 0) {
			setCurrentMonth(11);
			setCurrentYear(currentYear - 1);
		} else {
			setCurrentMonth(currentMonth - 1);
		}
	};

	const handleNextMonth = () => {
		if (currentMonth === 11) {
			setCurrentMonth(0);
			setCurrentYear(currentYear + 1);
		} else {
			setCurrentMonth(currentMonth + 1);
		}
	};

	const handlePreviousYear = () => {
		setCurrentYear(currentYear - 1);
	};

	const handleNextYear = () => {
		setCurrentYear(currentYear + 1);
	};

	const renderCalendar = () => {
		const daysInMonth = getDaysInMonth(currentMonth, currentYear);
		const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
		const days = [];

		// Empty cells before first day
		for (let i = 0; i < firstDay; i++) {
			days.push(<div key={`empty-start-${i}`} className={styles["calendar-day-empty"]} />);
		}

		// Days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			const isToday = day === now.getDate()
				&& currentMonth === now.getMonth()
				&& currentYear === now.getFullYear();

			days.push(
				<button
					key={`${currentYear}-${currentMonth}-${day}`}
					className={clsx(styles["calendar-day"], {
						[styles["calendar-day--today"]]: isToday,
					})}
					onClick={() => handleDateClick(day)}
					type="button"
				>
					{day}
				</button>,
			);
		}

		// Fill remaining cells to complete 6 rows (42 total cells)
		const totalCells = firstDay + daysInMonth;
		const remainingCells = 42 - totalCells;
		for (let i = 0; i < remainingCells; i++) {
			days.push(<div key={`empty-end-${i}`} className={styles["calendar-day-empty"]} />);
		}

		return days;
	};

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger asChild>
				{children}
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className={styles["dialog-overlay"]} />
				<Dialog.Content className={styles["dialog-content"]}>
					<div className={styles["calendar-header"]}>
						<Button
							variant="ghost"
							icon="double-chevron-left"
							onClick={handlePreviousYear}
							aria-label="Previous year"
						/>
						<Button
							variant="ghost"
							icon="chevron-left"
							onClick={handlePreviousMonth}
							aria-label="Previous month"
						/>
						<h2 className={styles["calendar-title"]}>
							{MONTHS[currentMonth]} {currentYear}
						</h2>
						<Button
							variant="ghost"
							icon="chevron-right"
							onClick={handleNextMonth}
							aria-label="Next month"
						/>
						<Button
							variant="ghost"
							icon="double-chevron-right"
							onClick={handleNextYear}
							aria-label="Next year"
						/>
					</div>

					<div className={styles["calendar-grid"]}>
						<div className={styles["calendar-weekdays"]}>
							{DAYS.map(day => (
								<div key={day} className={styles["calendar-weekday"]}>
									{day}
								</div>
							))}
						</div>
						<div className={styles["calendar-days"]}>
							{renderCalendar()}
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
