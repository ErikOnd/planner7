import clsx from "clsx";
import styles from "./Badge.module.scss";

export type BadgeVariant = "coming-soon" | "info" | "success" | "warning" | "error";

type BadgeProps = {
	children: React.ReactNode;
	variant?: BadgeVariant;
	className?: string;
};

export function Badge({ children, variant = "info", className }: BadgeProps) {
	return (
		<span className={clsx(styles["badge"], styles[`badge--${variant}`], className)}>
			{children}
		</span>
	);
}
