import styles from "./FeedbackPage.module.scss";

import { Button } from "@atoms/Button/Button";
import { Headline } from "@atoms/Headline/Headline";
import { Text } from "@atoms/Text/Text";
import Link from "next/link";

export default function FeedbackPage() {
	return (
		<main className={styles.page}>
			<div className={styles.card}>
				<Headline as="h1" className={styles.title}>Feedback is coming</Headline>
				<Text size="base" className={styles.subtitle}>
					This page will let you report bugs and share ideas soon. Thanks for helping us improve Planner7.
				</Text>
				<Link href="/app">
					<Button variant="secondary" fontWeight={600}>Back to app</Button>
				</Link>
			</div>
		</main>
	);
}
