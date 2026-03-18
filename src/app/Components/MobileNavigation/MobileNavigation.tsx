"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Icon } from "@atoms/Icons/Icon";
import { getCurrentWeek } from "@utils/getCurrentWeek";
import clsx from "clsx";
import { type CSSProperties, useEffect, useRef } from "react";
import styles from "./MobileNavigation.module.scss";

export type MobileSection = "weekly" | "remember" | "calendar" | "feedback" | "workspace" | "profile" | "add-task";

type MobileNavigationProps = {
	content: MobileSection;
	onChangeAction: (value: MobileSection) => void;
	onSelectDateAction: (date: Date) => void;
	selectedDate: Date;
	baseDate: Date;
	setBaseDateAction: (date: Date) => void;
	showWeekends?: boolean;
	onOpenAddAction: () => void;
};

const appNavItems: Array<{
	value: Exclude<MobileSection, "workspace">;
	label: string;
	icon: "planner" | "week" | "pencil" | "Megaphone" | "settings";
}> = [
	{ value: "weekly", label: "Planner", icon: "planner" },
	{ value: "remember", label: "Backlog", icon: "pencil" },
	{ value: "calendar", label: "Calendar", icon: "week" },
	{ value: "feedback", label: "Feedback", icon: "Megaphone" },
	{ value: "profile", label: "Settings", icon: "settings" },
];

function getWorkspaceInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("") || "P";
}

export function MobileNavigation(props: MobileNavigationProps) {
	const {
		content,
		onChangeAction,
		onSelectDateAction,
		selectedDate,
		baseDate,
		setBaseDateAction,
		showWeekends = true,
		onOpenAddAction,
	} = props;
	const { activeWorkspaceName } = useWorkspace();
	const workspaceInitials = getWorkspaceInitials(activeWorkspaceName ?? "Personal");
	const { days, rangeLabel } = getCurrentWeek(baseDate);
	const visibleDays = showWeekends
		? days
		: days.filter(({ fullDate }) => {
			const dayIndex = fullDate.getDay();
			return dayIndex >= 1 && dayIndex <= 5;
		});
	const dayRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const dayInMs = 86400000;
	const dayStripGapRem = 0.7;
	const dayCardStyle: CSSProperties = {
		flexBasis: `max(4.55rem, calc((100% - ${
			((visibleDays.length - 1) * dayStripGapRem).toFixed(4)
		}rem) / ${visibleDays.length}))`,
	};

	useEffect(() => {
		dayRefs.current = [];
	}, [showWeekends, baseDate]);

	useEffect(() => {
		const index = visibleDays.findIndex(({ fullDate }) => fullDate.toDateString() === selectedDate.toDateString());
		const selectedButton = dayRefs.current[index];
		selectedButton?.scrollIntoView({
			behavior: "smooth",
			inline: "center",
			block: "nearest",
		});
	}, [selectedDate, visibleDays]);

	return (
		<nav className={styles["mobile-navigation"]} aria-label="Mobile planner navigation">
			{content === "weekly" && (
				<div className={styles["planner-chrome"]}>
					<div className={styles["week-row"]}>
						<button
							type="button"
							className={styles["week-arrow"]}
							onClick={() => setBaseDateAction(new Date(baseDate.getTime() - (7 * dayInMs)))}
							aria-label="Previous week"
						>
							<Icon name="chevron-left" size={24} />
						</button>
						<div className={styles["week-title"]}>{rangeLabel}</div>
						<button
							type="button"
							className={styles["week-arrow"]}
							onClick={() => setBaseDateAction(new Date(baseDate.getTime() + (7 * dayInMs)))}
							aria-label="Next week"
						>
							<Icon name="chevron-right" size={24} />
						</button>
					</div>
					<div
						className={styles["day-strip"]}
						role="tablist"
						aria-label="Days in selected week"
					>
						{visibleDays.map(({ label, date, fullDate, isToday }, index) => {
							const isActive = fullDate.toDateString() === selectedDate.toDateString();

							return (
								<button
									key={fullDate.toISOString()}
									ref={(element) => {
										dayRefs.current[index] = element;
									}}
									type="button"
									role="tab"
									aria-selected={isActive}
									className={clsx(
										styles["day-card"],
										isActive && styles["day-card--active"],
										isToday && styles["day-card--today"],
									)}
									style={dayCardStyle}
									onClick={() => onSelectDateAction(fullDate)}
								>
									<span className={styles["day-card-label"]}>{label}</span>
									<span className={styles["day-card-number"]}>{date}</span>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{content === "remember" && (
				<button
					type="button"
					className={styles["mobile-add-button"]}
					onClick={onOpenAddAction}
					aria-label="Add task"
				>
					<Icon name="plus" size={26} />
				</button>
			)}

			<div className={styles["bottom-nav"]}>
				{appNavItems.slice(0, 3).map((item) => (
					<button
						key={item.label}
						type="button"
						className={clsx(
							styles["bottom-nav-item"],
							item.value === content && styles["bottom-nav-item--active"],
						)}
						onClick={() => onChangeAction(item.value)}
						aria-label={item.label}
						aria-current={item.value === content ? "page" : undefined}
					>
						<Icon name={item.icon} size={27} className={styles["bottom-nav-icon"]} />
					</button>
				))}
				{appNavItems.slice(3, 4).map((item) => (
					<button
						key={item.label}
						type="button"
						className={clsx(
							styles["bottom-nav-item"],
							item.value === content && styles["bottom-nav-item--active"],
						)}
						onClick={() => onChangeAction(item.value)}
						aria-label={item.label}
						aria-current={item.value === content ? "page" : undefined}
					>
						<Icon name={item.icon} size={27} className={styles["bottom-nav-icon"]} />
					</button>
				))}
				<button
					type="button"
					className={clsx(
						styles["bottom-nav-item"],
						content === "workspace" && styles["bottom-nav-item--active"],
					)}
					onClick={() => onChangeAction("workspace")}
					aria-label="Workspace"
					aria-current={content === "workspace" ? "page" : undefined}
				>
					<span
						className={clsx(
							styles["bottom-nav-avatar"],
							content === "workspace" && styles["bottom-nav-avatar--active"],
						)}
					>
						{workspaceInitials}
					</span>
				</button>
				{appNavItems.slice(4).map((item) => (
					<button
						key={item.label}
						type="button"
						className={clsx(
							styles["bottom-nav-item"],
							item.value === content && styles["bottom-nav-item--active"],
						)}
						onClick={() => onChangeAction(item.value)}
						aria-label={item.label}
						aria-current={item.value === content ? "page" : undefined}
					>
						<Icon name={item.icon} size={27} className={styles["bottom-nav-icon"]} />
					</button>
				))}
			</div>
		</nav>
	);
}
