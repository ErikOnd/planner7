import { Text } from "@atoms/Text/Text";
import clsx from "clsx";
import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.scss";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "secondary";
	children: ReactNode;
	size?: "xs" | "sm" | "base" | "lg" | "xl";
	fontWeight?: 300 | 500 | 600 | 700;
	wrapText?: boolean;
};

export function Button(props: ButtonProps) {
	const {
		variant = "primary",
		children,
		className,
		type = "button",
		size,
		fontWeight,
		wrapText = true,
		...rest
	} = props;

	return (
		<button
			type={type}
			className={clsx(styles.button, styles[variant], className)}
			{...rest}
		>
			{wrapText ? (
				<Text size={size} fontWeight={fontWeight}>{children}</Text>
			) : (
				children
			)}
		</button>
	);
}
