import styles from "./DesktopContent.module.scss";

import { DailyTextareaBlock } from "@components/DailyTextareaBlock/DailyTextareaBlock";
import { getCurrentWeek } from "@utils/getCurrentWeek";

type DesktopContentProps = {
	baseDate: Date;
	highlightedDate: Date | null;
};

export function DesktopContent(props: DesktopContentProps) {
	const { baseDate, highlightedDate } = props;
	const { days } = getCurrentWeek(baseDate);
	const today = new Date().toDateString();

	return (
		<div className={styles["desktop-content"]}>
			{days.map((day, index) => {
				const isHighlighted = highlightedDate?.toDateString() === day.fullDate.toDateString();
				return (
					<div key={index} className={styles["textarea-wrapper"]}>
						<DailyTextareaBlock
							textareaDate={day.fullDate}
							autoFocus={day.fullDate.toDateString() === today}
							isHighlighted={isHighlighted}
						/>
					</div>
				);
			})}
		</div>
	);
}
