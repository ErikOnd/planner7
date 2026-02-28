import Link from "next/link";

import styles from "./not-found.module.scss";

export default function NotFound() {
	return (
		<main className={styles["not-found-page"]}>
			<section className={styles["not-found-card"]}>
				<div className={styles["not-found-badge"]}>404 Not Found</div>
				<h1 className={styles["not-found-title"]}>You found the void between pages</h1>
				<p className={styles["not-found-text"]}>
					The page you are looking for is not here. It may have moved, been archived, or never existed.
				</p>
				<div className={styles["not-found-actions"]}>
					<Link className={styles["primary-link"]} href="/app">
						Back to my notes
					</Link>
					<Link className={styles["secondary-link"]} href="/">
						Go home
					</Link>
				</div>
			</section>
		</main>
	);
}
