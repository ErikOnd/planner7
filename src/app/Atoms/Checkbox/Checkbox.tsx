import { Text } from "@atoms/Text/Text";
import clsx from "clsx";
import { useId } from "react";
import styles from "./Checkbox.module.scss";

type CheckboxProps = {
	label: string;
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	className?: string;
	labelClassName?: string;
};

export default function Checkbox({ label, checked, onChange, className, labelClassName }: CheckboxProps) {
	const id = useId();

	return (
		<label className={clsx(styles["checkbox"], className)}>
			<input
				type="checkbox"
				id={id}
				checked={checked}
				onChange={(e) => onChange?.(e.target.checked)}
			/>
			<span className={styles["checkmark"]}></span>
			<Text className={clsx(styles["label"], labelClassName)}>{label}</Text>
		</label>
	);
}
