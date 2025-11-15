import { ChangeEvent } from "react";
import styles from "./InputField.module.scss";

type InputFieldProps = {
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	id?: string;
	name?: string;
	placeholder?: string;
	type?: string;
	autoComplete?: string;
	required?: boolean;
	disabled?: boolean;
};

export function InputField({
	value,
	onChange,
	id,
	name,
	placeholder = "Add a new task",
	type = "text",
	required = false,
	disabled = false,
}: InputFieldProps) {
	return (
		<input
			className={styles["input-field"]}
			type={type}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			name={name}
			id={id}
			required={required}
			disabled={disabled}
		/>
	);
}
