"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import clsx from "clsx";
import styles from "./ThemeToggle.module.scss";

/**
 * ThemeToggle Component
 * Accessible toggle button for switching between light and dark themes
 * Includes smooth animations and proper ARIA attributes
 */
export default function ThemeToggle() {
	const { theme, toggleTheme, mounted } = useTheme();

	return (
		<Button
			variant="secondary"
			onClick={toggleTheme}
		>
			<span className={clsx(styles["icon-wrapper"], !mounted && styles["icon-wrapper--hidden"])}>
				<Icon
					name="sun"
					className={clsx(styles.icon, styles.sun, theme === "light" && styles.active)}
				/>

				<Icon
					name="moon"
					className={clsx(styles.icon, styles.moon, theme === "dark" && styles.active)}
				/>
			</span>
		</Button>
	);
}
