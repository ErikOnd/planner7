import styles from "./Checkbox.module.scss";

import { Text } from "@atoms/Text/Text";
import { useId } from "react";

type CheckboxProps = {
	label: string;
	checked?: boolean;
	onChange?: (checked: boolean) => void;
};

export default function Checkbox({ label, checked, onChange }: CheckboxProps) {
	const id = useId();

	return (
		<label className={styles["checkbox"]}>
			<input
				type="checkbox"
				id={id}
				checked={checked}
				onChange={(e) => onChange?.(e.target.checked)}
			/>
			<span className={styles["checkmark"]}></span>
			<Text className={styles["label"]}>{label}</Text>
		</label>
	);
}
