import styles from "./Spinner.module.scss";

type SpinnerProps = {
	className?: string;
};

export function Spinner({ className }: SpinnerProps) {
	return (
		<div className={`${styles.spinner} ${className || ""}`} role="status" aria-live="polite">
			<span className={styles["pac-man"]} aria-hidden="true" />
			<span className={styles.visuallyHidden}>Loading</span>
		</div>
	);
}
