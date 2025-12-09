import styles from "./Button.module.scss";

import { Icon, IconName } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";
import clsx from "clsx";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "secondary" | "ghost";
	children?: ReactNode;
	size?: "xs" | "sm" | "base" | "lg" | "xl";
	iconSize?: number;
	fontWeight?: 300 | 500 | 600 | 700;
	wrapText?: boolean;
	icon?: IconName;
};

export function Button(props: ButtonProps) {
	const {
		variant = "primary",
		children,
		className,
		type = "button",
		size,
		iconSize,
		fontWeight,
		wrapText = true,
		icon,
		...rest
	} = props;

	if (!icon) {
		return (
			<button
				type={type}
				className={clsx(styles.button, styles[variant], className)}
				{...rest}
			>
				{wrapText ? <Text size={size} fontWeight={fontWeight}>{children}</Text> : children}
			</button>
		);
	} else {
		return (
			<button
				type={type}
				className={clsx(styles.button, styles["icon-button"], styles[variant], className)}
				{...rest}
			>
				<Icon name={icon} size={iconSize}></Icon>
			</button>
		);
	}
}
