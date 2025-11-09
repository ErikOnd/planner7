import styles from "./Message.module.scss";

import { Text } from "@atoms/Text/Text";
import clsx from "clsx";

type MessageProps = {
	variant: "error" | "info";
	children: string | null;
};

export function Message({ variant, children }: MessageProps) {
	if (!children) return null;

	return (
		<Text
			as="p"
			size="sm"
			className={clsx(
				variant === "error" && styles["message-error"],
				variant === "info" && styles["message-info"],
			)}
		>
			{children}
		</Text>
	);
}
