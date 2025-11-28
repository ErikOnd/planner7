import styles from "./DesktopContent.module.scss";

import type { Block } from "@blocknote/core";
import { DailyTextareaBlock } from "@components/DailyTextareaBlock/DailyTextareaBlock";
import { getCurrentWeek } from "@utils/getCurrentWeek";

type NotesCache = {
	setCache: (dateString: string, content: Block[] | undefined) => void;
	getCache: (dateString: string) => Block[] | undefined;
};

type DesktopContentProps = {
	baseDate: Date;
	notesCache: NotesCache;
};

export function DesktopContent(props: DesktopContentProps) {
	const { baseDate, notesCache } = props;
	const { days } = getCurrentWeek(baseDate);
	const today = new Date().toDateString();

	return (
		<div className={styles["desktop-content"]}>
			{days.map((day, index) => (
				<div key={index} className={styles["textarea-wrapper"]}>
					<DailyTextareaBlock
						textareaDate={day.fullDate}
						autoFocus={day.fullDate.toDateString() === today}
						notesCache={notesCache}
					/>
				</div>
			))}
		</div>
	);
}
