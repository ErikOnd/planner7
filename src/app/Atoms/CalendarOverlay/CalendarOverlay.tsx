"use client";

import { Icon } from "@atoms/Icons/Icon";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { useEffect, useState } from "react";
import styles from "./CalendarOverlay.module.scss";

type CalendarBaseProps = {
	onDateSelect: (date: Date) => void;
	activeDate?: Date;
	showWeekends?: boolean;
	className?: string;
};

type CalendarOverlayProps = CalendarBaseProps & {
	children: React.ReactNode;
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

function isSameDay(left: Date, right: Date) {
	return left.getFullYear() === right.getFullYear()
		&& left.getMonth() === right.getMonth()
		&& left.getDate() === right.getDate();
}

function useCalendarState(activeDate?: Date) {
	const now = new Date();
	const visibleDate = activeDate ?? now;
	const [currentMonth, setCurrentMonth] = useState(visibleDate.getMonth());
	const [currentYear, setCurrentYear] = useState(visibleDate.getFullYear());

	useEffect(() => {
		setCurrentMonth(visibleDate.getMonth());
		setCurrentYear(visibleDate.getFullYear());
	}, [visibleDate]);

	return {
		now,
		visibleDate,
		currentMonth,
		currentYear,
		setCurrentMonth,
		setCurrentYear,
	};
}

export function CalendarPanel({
	onDateSelect,
	activeDate,
	showWeekends = true,
	className,
}: CalendarBaseProps) {
	const {
		now,
		visibleDate,
		currentMonth,
		currentYear,
		setCurrentMonth,
		setCurrentYear,
	} = useCalendarState(activeDate);

	const getDaysInMonth = (month: number, year: number) => {
		return new Date(year, month + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (month: number, year: number) => {
		const day = new Date(year, month, 1).getDay();
		return day === 0 ? 6 : day - 1;
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

		for (let i = 0; i < firstDay; i++) {
			days.push(<div key={`empty-start-${i}`} className={styles["calendar-day-empty"]} />);
		}

		for (let day = 1; day <= daysInMonth; day++) {
			const currentDate = new Date(currentYear, currentMonth, day);
			const dayOfWeek = currentDate.getDay();
			const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
			const isDisabled = !showWeekends && isWeekend;
			const isSelected = isSameDay(currentDate, visibleDate);
			const isToday = isSameDay(currentDate, now);

			days.push(
				<button
					key={`${currentYear}-${currentMonth}-${day}`}
					className={clsx(styles["calendar-day"], {
						[styles["calendar-day--selected"]]: isSelected,
						[styles["calendar-day--today"]]: isToday && !isSelected,
						[styles["calendar-day--disabled"]]: isDisabled,
					})}
					onClick={() => {
						if (!isDisabled) {
							onDateSelect(currentDate);
						}
					}}
					disabled={isDisabled}
					aria-disabled={isDisabled}
					aria-current={isSelected ? "date" : undefined}
					type="button"
				>
					{day}
				</button>,
			);
		}

		const totalCells = firstDay + daysInMonth;
		const remainingCells = 42 - totalCells;
		for (let i = 0; i < remainingCells; i++) {
			days.push(<div key={`empty-end-${i}`} className={styles["calendar-day-empty"]} />);
		}

		return days;
	};

	const handleGoToToday = () => {
		onDateSelect(now);
	};

	return (
		<div className={clsx(styles["calendar-panel"], className)}>
			<div className={styles["calendar-header"]}>
				<button
					type="button"
					className={styles["calendar-nav-button"]}
					onClick={handlePreviousYear}
					aria-label="Previous year"
				>
					<Icon name="double-chevron-left" size={22} />
				</button>
				<button
					type="button"
					className={styles["calendar-nav-button"]}
					onClick={handlePreviousMonth}
					aria-label="Previous month"
				>
					<Icon name="chevron-left" size={22} />
				</button>
				<h2 className={styles["calendar-title"]}>
					{MONTHS[currentMonth]} {currentYear}
				</h2>
				<button
					type="button"
					className={styles["calendar-nav-button"]}
					onClick={handleNextMonth}
					aria-label="Next month"
				>
					<Icon name="chevron-right" size={22} />
				</button>
				<button
					type="button"
					className={styles["calendar-nav-button"]}
					onClick={handleNextYear}
					aria-label="Next year"
				>
					<Icon name="double-chevron-right" size={22} />
				</button>
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

			<div className={styles["calendar-footer"]}>
				<button
					type="button"
					className={styles["calendar-today-button"]}
					onClick={handleGoToToday}
				>
					Go to Today
				</button>
			</div>
		</div>
	);
}

export function CalendarOverlay({
	children,
	onDateSelect,
	activeDate,
	showWeekends = true,
}: CalendarOverlayProps) {
	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				{children}
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className={styles["dialog-overlay"]} />
				<Dialog.Content className={styles["dialog-content"]}>
					<Dialog.Title className={styles["visually-hidden"]}>Calendar</Dialog.Title>
					<Dialog.Description className={styles["visually-hidden"]}>
						Select a date from the month view.
					</Dialog.Description>
					<CalendarPanel
						onDateSelect={onDateSelect}
						activeDate={activeDate}
						showWeekends={showWeekends}
					/>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
