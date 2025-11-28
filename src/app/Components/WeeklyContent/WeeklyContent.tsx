"use client";

import styles from "./WeeklyContent.module.scss";

import type { Block } from "@blocknote/core";
import { DailyTextareaBlock } from "@components/DailyTextareaBlock/DailyTextareaBlock";

type NotesCache = {
	setCache: (dateString: string, content: Block[] | undefined) => void;
	getCache: (dateString: string) => Block[] | undefined;
};

type WeeklyContentProps = {
	selectedDate: Date;
	notesCache: NotesCache;
};

export function WeeklyContent(props: WeeklyContentProps) {
	const { selectedDate, notesCache } = props;

	return (
		<div className={styles["weekly-content"]}>
			<DailyTextareaBlock textareaDate={selectedDate} autoFocus={true} notesCache={notesCache} />
		</div>
	);
}
