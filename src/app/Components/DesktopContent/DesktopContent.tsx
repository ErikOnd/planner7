import styles from "./DesktopContent.module.scss";

import { DailyTextareaBlock } from "@components/DailyTextareaBlock/DailyTextareaBlock";
import { getCurrentWeek } from "@utils/getCurrentWeek";
import { motion } from "framer-motion";

type DesktopContentProps = {
	baseDate: Date;
	highlightedDate: Date | null;
	showWeekends?: boolean;
};

export function DesktopContent(props: DesktopContentProps) {
	const { baseDate, highlightedDate, showWeekends = true } = props;
	const { days } = getCurrentWeek(baseDate);
	const today = new Date().toDateString();
	const visibleDays = showWeekends
		? days
		: days.filter((day) => {
			const dayIndex = day.fullDate.getDay();
			return dayIndex >= 1 && dayIndex <= 5;
		});

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.08,
				delayChildren: 0.2,
			},
		},
	};

	const cardVariants = {
		hidden: {
			opacity: 0,
			y: 30,
			scale: 0.95,
		},
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: {
				duration: 0.5,
				ease: [0.16, 1, 0.3, 1] as const,
			},
		},
	};

	return (
		<motion.div
			key={showWeekends ? "weekends" : "weekdays"}
			className={styles["desktop-content"]}
			initial="hidden"
			animate="visible"
			variants={containerVariants}
		>
			{visibleDays.map((day, index) => {
				const isHighlighted = highlightedDate?.toDateString() === day.fullDate.toDateString();
				return (
					<motion.div
						key={index}
						className={styles["textarea-wrapper"]}
						variants={cardVariants}
					>
						<DailyTextareaBlock
							textareaDate={day.fullDate}
							autoFocus={day.fullDate.toDateString() === today}
							isHighlighted={isHighlighted}
						/>
					</motion.div>
				);
			})}
		</motion.div>
	);
}
