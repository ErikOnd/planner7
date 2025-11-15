"use client";

import styles from "./PasswordField.module.scss";

import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import { InputField } from "@atoms/InputField/InputField";
import { Text } from "@atoms/Text/Text";
import { useId, useState } from "react";

export type PasswordFieldProps = {
	label?: string;
	value: string;
	onChange: (val: string) => void;
	placeholder?: string;
	disabled?: boolean;
	name?: string;
	autoComplete?: string;
	id?: string;
};

export function PasswordField({
	label = "Password",
	value,
	onChange,
	placeholder = "Your password",
	disabled,
	name = "password",
	autoComplete = "current-password",
}: PasswordFieldProps) {
	const id = useId();
	const [show, setShow] = useState(false);

	return (
		<div>
			<label htmlFor={id}>
				<Text as="span" size="sm" fontWeight={600}>{label}</Text>
			</label>
			<div className={styles["password-wrapper"]}>
				<InputField
					id={id}
					name={name}
					type={show ? "text" : "password"}
					value={value}
					placeholder={placeholder}
					autoComplete={autoComplete}
					required
					disabled={disabled}
					onChange={(e) => onChange(e.target.value)}
				/>
				<Button
					wrapText={false}
					type="button"
					variant="secondary"
					onClick={() => setShow((s) => !s)}
					disabled={disabled}
					aria-pressed={show}
					aria-label={show ? "Hide password" : "Show password"}
				>
					{show ? <Icon name="eye" /> : <Icon name="closed-eye" />}
				</Button>
			</div>
		</div>
	);
}
