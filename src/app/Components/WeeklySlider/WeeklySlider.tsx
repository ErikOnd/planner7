import styles from "./WeeklySlider.module.scss";

import { Text } from "@atoms/Text/Text";
import {Button} from "@atoms/Button/Button";

type WeeklySlider = {
	baseDate: Date;
	setBaseDate: (date: Date) => void;
	rangeLabel: string;
};

export default function WeeklySlider(props: WeeklySlider) {
	const { baseDate, setBaseDate, rangeLabel } = props;
	const dayInMs = 86400000;
	return (
		<div className={styles["weekly-slider"]}>
			<Button
				variant="ghost"
				icon="chevron-left"
				onClick={() => setBaseDate(new Date(baseDate.getTime() - 7 * dayInMs))}
			/>
			<Text>{rangeLabel}</Text>
			<Button
				variant="ghost"
				icon="chevron-right"
				onClick={() => setBaseDate(new Date(baseDate.getTime() + 7 * dayInMs))}
			/>
		</div>
	);
}
