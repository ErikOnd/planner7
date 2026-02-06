import styles from "./Headline.module.scss";

import clsx from "clsx";
import { ReactNode } from "react";

type HeadlineProps = {
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
	children: ReactNode;
	className?: string;
};

const headlineMap = {
	h1: "headline1",
	h2: "headline2",
	h3: "headline3",
	h4: "headline4",
	h5: "headline5",
	h6: "headline6",
} as const;

export function Headline({
	as = "h2",
	children,
	className,
}: HeadlineProps) {
	const Tag = as;
	const headlineClass = styles[headlineMap[as]];

	return (
		<Tag className={clsx(headlineClass, className)}>
			{children}
		</Tag>
	);
}
