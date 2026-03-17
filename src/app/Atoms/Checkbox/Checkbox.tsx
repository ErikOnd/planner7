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
	checkmarkClassName?: string;
};

export default function Checkbox(
	{ label, checked, onChange, className, labelClassName, checkmarkClassName }: CheckboxProps,
) {
	const id = useId();

	return (
		<label className={clsx(styles["checkbox"], className)}>
			<input
				type="checkbox"
				id={id}
				checked={checked}
				onChange={(e) => onChange?.(e.target.checked)}
			/>
			<span className={clsx(styles["checkmark"], checkmarkClassName)}></span>
			<Text className={clsx(styles["label"], labelClassName)}>{label}</Text>
		</label>
	);
}
