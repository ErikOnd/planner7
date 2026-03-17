import { Icon, IconName } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";
import clsx from "clsx";
import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.scss";

type BaseButtonProps = {
	variant?: "primary" | "secondary" | "ghost" | "danger";
	children?: ReactNode;
	size?: "xs" | "sm" | "base" | "lg" | "xl";
	iconSize?: number;
	fontWeight?: 300 | 500 | 600 | 700;
	wrapText?: boolean;
	icon?: IconName;
};

type ButtonAsButtonProps = BaseButtonProps & ButtonHTMLAttributes<HTMLButtonElement> & {
	href?: undefined;
};

type ButtonAsLinkProps = BaseButtonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "type"> & {
	href: string;
};

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

function renderContent(
	icon: IconName | undefined,
	iconSize: number | undefined,
	wrapText: boolean,
	size: BaseButtonProps["size"],
	fontWeight: BaseButtonProps["fontWeight"],
	children: ReactNode,
) {
	const hasChildren = children !== undefined && children !== null;
	const textContent = wrapText ? <Text size={size} fontWeight={fontWeight}>{children}</Text> : children;

	if (!icon) return textContent;
	if (!hasChildren) return <Icon name={icon} size={iconSize} />;

	return (
		<span className={styles["button-content"]}>
			<Icon name={icon} size={iconSize} />
			{textContent}
		</span>
	);
}

export function Button(props: ButtonProps) {
	const resolveSize = (value: BaseButtonProps["size"]) => {
		if (value === "xs" || value === "sm") return "sm";
		if (value === "lg" || value === "xl") return "lg";
		return "base";
	};

	if ("href" in props && props.href) {
		const {
			variant = "primary",
			children,
			className,
			size,
			iconSize,
			fontWeight,
			wrapText = true,
			icon,
			href,
			...linkProps
		} = props;
		const iconOnly = Boolean(icon) && !children;
		const resolvedSize = resolveSize(size);
		const resolvedIconSize = iconSize ?? (resolvedSize === "lg" ? 20 : 18);

		const classNames = clsx(
			styles.button,
			styles[`size-${resolvedSize}`],
			styles[variant],
			iconOnly && styles["icon-button"],
			className,
		);

		return (
			<Link
				href={href}
				className={classNames}
				{...(linkProps as AnchorHTMLAttributes<HTMLAnchorElement>)}
			>
				{renderContent(icon, resolvedIconSize, wrapText, size, fontWeight, children)}
			</Link>
		);
	}

	const buttonPropsTyped = props as ButtonAsButtonProps;
	const {
		variant = "primary",
		children,
		className,
		size,
		iconSize,
		fontWeight,
		wrapText = true,
		icon,
		type = "button",
		...buttonProps
	} = buttonPropsTyped;
	const iconOnly = Boolean(icon) && !children;
	const resolvedSize = resolveSize(size);
	const resolvedIconSize = iconSize ?? (resolvedSize === "lg" ? 20 : 18);

	const classNames = clsx(
		styles.button,
		styles[`size-${resolvedSize}`],
		styles[variant],
		iconOnly && styles["icon-button"],
		className,
	);

	return (
		<button
			type={type}
			className={classNames}
			{...buttonProps}
		>
			{renderContent(icon, resolvedIconSize, wrapText, size, fontWeight, children)}
		</button>
	);
}
