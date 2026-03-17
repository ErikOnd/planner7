"use client";

import styles from "./FeedbackDialog.module.scss";

import { Button } from "@atoms/Button/Button";
import { Text } from "@atoms/Text/Text";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { motion } from "framer-motion";
import { ReactNode, useId, useMemo, useState } from "react";

type FeedbackType = "bug" | "feature";

type FeedbackDialogProps = {
	children: ReactNode;
};

type FeedbackPanelProps = {
	closeAction?: ReactNode;
	className?: string;
};

const SUPPORT_EMAIL = "support@planner7.com";
const FEEDBACK_OPTIONS: Array<{ id: FeedbackType; label: string }> = [
	{ id: "bug", label: "Bug report" },
	{ id: "feature", label: "Feature request" },
];

export function FeedbackPanel({ closeAction, className }: FeedbackPanelProps) {
	const descriptionId = useId();
	const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
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
		return `mailto:${SUPPORT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;
	}, [description, feedbackType]);

	const handleOpenEmailDraft = () => {
		window.location.href = mailtoHref;
	};

	return (
		<div className={clsx(styles["dialog-shell"], className)}>
			<header className={styles.header}>
				<div className={styles["header-copy"]}>
					<h1 className={styles.title}>Feedback</h1>
					<Text size="lg" className={styles.subtitle}>
						Report bugs and request features so we can improve Planner7 faster.
					</Text>
				</div>
				{closeAction}
			</header>

			<form className={styles.form} noValidate>
				<div className={styles.section}>
					<Text size="xs" fontWeight={700} className={styles["section-label"]}>Feedback Type</Text>
					<div className={styles["segmented-control"]} role="radiogroup" aria-label="Feedback type">
						{FEEDBACK_OPTIONS.map((option) => {
							const isActive = feedbackType === option.id;

							return (
								<button
									key={option.id}
									type="button"
									role="radio"
									aria-checked={isActive}
									className={clsx(
										styles["segmented-option"],
										isActive && styles["segmented-option--active"],
									)}
									onClick={() => setFeedbackType(option.id)}
								>
									{isActive && (
										<motion.span
											layoutId="feedback-segment-highlight"
											className={styles["segmented-highlight"]}
											transition={{
												type: "spring",
												stiffness: 420,
												damping: 34,
												mass: 0.85,
											}}
										/>
									)}
									<span className={styles["segmented-option-label"]}>{option.label}</span>
								</button>
							);
						})}
					</div>
				</div>

				<div className={styles.section}>
					<label htmlFor={descriptionId} className={styles["section-label"]}>Description</label>
					<textarea
						id={descriptionId}
						name="description"
						className={styles.textarea}
						placeholder="What happened, or what would you like to see?"
						rows={7}
						value={description}
						onChange={(event) => setDescription(event.target.value)}
					/>
					<div className={styles["helper-row"]}>
						<span className={styles["helper-icon"]} aria-hidden="true">i</span>
						<Text size="xs" className={styles["helper-text"]}>
							Adding screenshots or images in your email helps us debug issues and implement feature requests faster.
						</Text>
					</div>
				</div>

				<Button
					type="button"
					variant="primary"
					size="lg"
					fontWeight={700}
					icon="send"
					iconSize={24}
					className={styles["submit-button"]}
					onClick={handleOpenEmailDraft}
				>
					Open email draft
				</Button>
			</form>
		</div>
	);
}

export function FeedbackDialog({ children }: FeedbackDialogProps) {
	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				{children}
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className={styles["dialog-overlay"]} />
				<Dialog.Content className={styles["dialog-content"]}>
					<Dialog.Title className={styles["visually-hidden"]}>Feedback</Dialog.Title>
					<Dialog.Description className={styles["visually-hidden"]}>
						Report bugs and request features so we can improve Planner7 faster.
					</Dialog.Description>
					<FeedbackPanel
						closeAction={
							<Dialog.Close asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									icon="close"
									className={styles["close-button"]}
									aria-label="Close feedback dialog"
								/>
							</Dialog.Close>
						}
					/>
				</Dialog.Content>
				<div className={styles["mobile-nav-blocker"]} aria-hidden="true" />
			</Dialog.Portal>
		</Dialog.Root>
	);
}
