import clsx from "clsx";
import styles from "./Badge.module.scss";

export type BadgeVariant = "coming-soon" | "primary" | "info" | "success" | "warning" | "error";
export type BadgeShape = "rounded" | "pill";
export type BadgeSize = "sm" | "md";

type BadgeProps = {
	children: React.ReactNode;
	variant?: BadgeVariant;
	shape?: BadgeShape;
	size?: BadgeSize;
	className?: string;
};

export function Badge({
	children,
	variant = "info",
	shape = "rounded",
	size = "md",
	className,
}: BadgeProps) {
	return (
		<span
			className={clsx(
				styles["badge"],
				styles[`badge--${variant}`],
				styles[`badge--${shape}`],
				styles[`badge--${size}`],
				className,
			)}
		>
			{children}
		</span>
	);
}
