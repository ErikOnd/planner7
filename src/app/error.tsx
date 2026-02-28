"use client";

import styles from "./error.module.scss";

import { Button } from "@atoms/Button/Button";
import { useEffect } from "react";

type ErrorBoundaryProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
	useEffect(() => {
		console.error("Unhandled app error:", error);
	}, [error]);

	return (
		<main className={styles["error-page"]}>
			<section className={styles["error-card"]}>
				<div className={styles["error-badge"]}>500 Error</div>
				<h1 className={styles["error-title"]}>Our planner took a coffee break</h1>
				<p className={styles["error-text"]}>
					We could not load this page right now. Please try again.
				</p>
				<p className={styles["error-joke"]}>
					Good news: your tasks are still there. Bad news: this page is currently pretending it is Monday.
				</p>
				<div className={styles["error-actions"]}>
					<Button type="button" variant="primary" fontWeight={700} onClick={() => reset()}>
						Try again
					</Button>
				</div>
			</section>
		</main>
	);
}
