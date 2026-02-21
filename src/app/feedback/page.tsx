"use client";

import styles from "./FeedbackPage.module.scss";

import { Button } from "@atoms/Button/Button";
import { Headline } from "@atoms/Headline/Headline";
import { Text } from "@atoms/Text/Text";
import { useMemo, useState } from "react";

export default function FeedbackPage() {
	const supportEmail = "support@planner7.com";
	const [feedbackType, setFeedbackType] = useState<"bug" | "feature">("bug");
	const [description, setDescription] = useState("");

	const mailtoHref = useMemo(() => {
		const kind = feedbackType === "bug" ? "Bug Report" : "Feature Request";
		const subject = `[Planner7] ${kind}`;
		const bodyLines = [
			`Planner7 ${kind}`,
			"",
			"Description:",
			description.trim() || "(Please add details)",
			"",
			"Please see the attached screenshot before reviewing this report",
		];

		const encodedSubject = encodeURIComponent(subject);
		const encodedBody = encodeURIComponent(bodyLines.join("\n"));
		return `mailto:${supportEmail}?subject=${encodedSubject}&body=${encodedBody}`;
	}, [description, feedbackType]);

	const handleOpenEmailApp = () => {
		window.location.href = mailtoHref;
	};

	return (
		<main className={styles.page}>
			<section className={styles.shell}>
				<header className={styles.header}>
					<div>
						<Headline as="h1" className={styles.title}>Feedback</Headline>
						<Text size="base" className={styles.subtitle}>
							Report bugs and request features so we can improve Planner7 faster.
						</Text>
					</div>
					<Button href="/app" variant="secondary" fontWeight={600}>
						Back to app
					</Button>
				</header>

				<form className={styles.form} noValidate>
					<div className={styles.section}>
						<Text size="sm" fontWeight={700} className={styles.sectionLabel}>Type</Text>
						<div className={styles.typeGroup} role="radiogroup" aria-label="Feedback type">
							<label className={styles.typeOption}>
								<input
									type="radio"
									name="feedbackType"
									value="bug"
									checked={feedbackType === "bug"}
									onChange={() => setFeedbackType("bug")}
								/>
								<span>Bug report</span>
							</label>
							<label className={styles.typeOption}>
								<input
									type="radio"
									name="feedbackType"
									value="feature"
									checked={feedbackType === "feature"}
									onChange={() => setFeedbackType("feature")}
								/>
								<span>Feature request</span>
							</label>
						</div>
					</div>

					<div className={styles.field}>
						<label htmlFor="feedback-description" className={styles.label}>Description</label>
						<textarea
							id="feedback-description"
							name="description"
							className={styles.textarea}
							placeholder="What happened, or what would you like to see?"
							rows={6}
							value={description}
							onChange={(event) => setDescription(event.target.value)}
						/>
						<Text size="xs" className={styles.helperHint}>
							Adding screenshots or images in your email helps us debug issues and implement feature requests faster.
						</Text>
					</div>

					<div className={styles.footer}>
						<Button type="button" variant="primary" fontWeight={700} onClick={handleOpenEmailApp}>
							Open email draft
						</Button>
					</div>
				</form>
			</section>
		</main>
	);
}
