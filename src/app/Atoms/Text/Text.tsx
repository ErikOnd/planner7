import styles from "./Text.module.scss";

import clsx from "clsx";
import { ReactNode } from "react";

type TextProps = {
	size?: "xs" | "sm" | "base" | "lg" | "xl";
	as?: "p" | "span";
	children: ReactNode;
	className?: string;
	fontWeight?: 300 | 500 | 600 | 700;
	variant?: "default" | "muted";
};

export function Text({
	size = "base",
	as = "p",
	children,
	className,
	fontWeight,
	variant = "default",
}: TextProps) {
	const Tag = as;
	return (
		<Tag
			className={clsx(
				styles[`text-${size}`],
				fontWeight && styles[`weight-${fontWeight}`],
				variant !== "default" && styles[`variant-${variant}`],
				className,
			)}
		>
			{children}
		</Tag>
	);
}
