"use client";

import styles from "./DailyTextareaBlock.module.scss";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
const SmartEditor = dynamic(() => import("@atoms/SmartEditor/SmartEditor"), {
	ssr: false,
});

import { Text } from "@atoms/Text/Text";
import { formatToDayLabel } from "@utils/formatToDayLabel";
import clsx from "clsx";

type DailyTextareaProps = {
	textareaDate: Date;
	autoFocus?: boolean;
};

export function DailyTextareaBlock(props: DailyTextareaProps) {
	const { textareaDate } = props;
	const { weekday, date } = formatToDayLabel(textareaDate);
	const isToday = textareaDate.toDateString() === new Date().toDateString();
	const textareaBlock = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!isToday || !textareaBlock.current) return;
		const el = textareaBlock.current;
		const rect = el.getBoundingClientRect();
		const vpH = window.innerHeight || document.documentElement.clientHeight;
		const fullyInView = rect.top >= 0 && rect.bottom <= vpH;
		if (!fullyInView) {
			el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
		}
	}, [isToday]);

	const DailyTextareaBlockClass = clsx(styles["daily-textarea-block"], isToday && styles["is-today"]);

	return (
		<div ref={textareaBlock} className={DailyTextareaBlockClass}>
			<div className={styles["date"]}>
				<Text className={styles["day-batch"]}>{weekday}</Text>
				<Text className={styles["month-and-day"]}>{date}</Text>
			</div>
			<div className={styles["editor-container"]}>
				<SmartEditor />
			</div>
		</div>
	);
}
