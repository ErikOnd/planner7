"use client";

import styles from "./LandingPage.module.scss";

import { Button } from "@atoms/Button/Button";
import { Headline } from "@atoms/Headline/Headline";
import { Icon } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { StructuredNotesResponse } from "../../actions/aiNotes";
import { LexicalPreview } from "./LexicalPreview";
import { MagneticButton } from "./MagneticButton";
import { TypingAnimation } from "./TypingAnimation";

const features = [
	{
		icon: "pencil" as const,
		title: "Rich Daily Planning",
		description:
			"Each day gives you a rich planning area to think clearly, capture context, and shape real execution plans.",
	},
	{
		icon: "ai-sparkles" as const,
		title: "AI Voice Structuring",
		description:
			"Speak naturally and get structured notes with headings, bullets, and checkboxes while preserving key details.",
	},
	{
		icon: "calendar" as const,
		title: "Weekly Focus View",
		description: "Work in one focused weekly view with rich daily notes and backlog tasks side by side.",
	},
];

const steps = [
	{
		title: "Create your account",
		description: "Sign up in seconds and open your weekly workspace instantly.",
	},
	{
		title: "Tap the AI mic",
		description: "Record your thoughts naturally in any language, just like speaking in a meeting.",
	},
	{
		title: "Review and ship your day",
		description: "Your transcript becomes structured notes you can edit, prioritize, and execute.",
	},
];

const transcriptBefore = [
	"okay quick update i have meeting with northstar labs at 14:30",
	"need to finish ORBIT-512 and ORBIT-513 today",
	"blocker: api auth for exports still failing",
	"ask anna for qa signoff before friday",
];

const transcriptAfter: StructuredNotesResponse["blocks"] = [
	{
		type: "heading2",
		segments: [{ text: "Today" }],
	},
	{
		type: "bulleted_list",
		items: [
			{ segments: [{ text: "Meeting: Northstar Labs sync (14:30)" }] },
			{ segments: [{ text: "Tickets: ORBIT-512, ORBIT-513" }] },
		],
	},
	{
		type: "heading2",
		segments: [{ text: "Blockers" }],
	},
	{
		type: "bulleted_list",
		items: [{ segments: [{ text: "API auth for exports is still failing" }] }],
	},
	{
		type: "heading2",
		segments: [{ text: "Next actions" }],
	},
	{
		type: "checklist",
		items: [{ checked: false, segments: [{ text: "Ask Anna for QA signoff before Friday" }] }],
	},
];

export function LandingPage() {
	const featuresRef = useRef(null);
	const stepsRef = useRef(null);
	const ctaRef = useRef(null);

	const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
	const stepsInView = useInView(stepsRef, { once: true, margin: "-100px" });
	const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" });

	const navVariants = {
		hidden: { y: -20, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
		},
	};

	const heroVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
				delayChildren: 0.3,
			},
		},
	};

	const heroItemVariants = {
		hidden: { y: 30, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
		},
	};

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
				delayChildren: 0.2,
			},
		},
	};

	const cardVariants = {
		hidden: { y: 40, opacity: 0, scale: 0.95 },
		visible: {
			y: 0,
			opacity: 1,
			scale: 1,
			transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
		},
	};

	return (
		<>
			<header>
				<motion.nav
					className={styles.nav}
					initial="hidden"
					animate="visible"
					variants={navVariants}
				>
					<Link href="/" className={styles.logo}>
						<Image src="/logo-mark.svg" alt="Planner7 logo" width={96} height={96} className={styles["logo-icon"]} />
					</Link>
					<div className={styles["nav-actions"]}>
						<MagneticButton>
							<Button href="/signup" variant="primary" fontWeight={700}>Get Started</Button>
						</MagneticButton>
					</div>
				</motion.nav>
			</header>

			<main>
				<motion.section
					className={styles.hero}
					initial="hidden"
					animate="visible"
					variants={heroVariants}
				>
					<motion.div variants={heroItemVariants}>
						<Headline as="h1" className={styles["hero-headline"]}>
							Plan your time,<br />
							<TypingAnimation />
						</Headline>
					</motion.div>
					<motion.div variants={heroItemVariants}>
						<Text size="lg" className={styles["hero-subtitle"]}>
							Planner7 gives every day a rich planning area for real thinking, not just checkboxes. AI voice notes are
							built in, so you can speak your thoughts and instantly get a structured plan.
						</Text>
					</motion.div>
				</motion.section>

				<section className={styles.features} ref={featuresRef}>
					<Text size="sm" fontWeight={700} className={styles["section-label"]}>What you get</Text>
					<Headline as="h2" className={styles["section-title"]}>
						A planning workflow that actually scales
					</Headline>
					<motion.div
						className={styles["feature-cards"]}
						initial="hidden"
						animate={featuresInView ? "visible" : "hidden"}
						variants={containerVariants}
					>
						{features.map((feature) => (
							<motion.div key={feature.title} className={styles["feature-card"]} variants={cardVariants}>
								<div className={styles["feature-icon"]}>
									<Icon
										name={feature.icon}
										size={feature.title === "AI Voice Structuring" ? 40 : 22}
									/>
								</div>
								<Text size="base" fontWeight={600} className={styles["feature-title"]}>{feature.title}</Text>
								<Text size="sm" className={styles["feature-description"]}>{feature.description}</Text>
							</motion.div>
						))}
					</motion.div>
				</section>

				<section className={styles["voice-showcase"]}>
					<Text size="sm" fontWeight={700} className={styles["section-label"]}>AI workflow</Text>
					<Headline as="h2" className={styles["section-title"]}>
						How voice becomes structured notes
					</Headline>
					<motion.div
						className={styles["transcript-demo"]}
						initial={{ opacity: 0, y: 22 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.35 }}
						transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
					>
						<div className={styles["transcript-panel"]}>
							<span className={styles["transcript-chip"]}>Before</span>
							<Text size="sm" className={styles["transcript-heading"]}>Raw voice transcript</Text>
							<motion.div
								initial={{ opacity: 0, x: -10 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.35 }}
							>
								<LexicalPreview plainLines={transcriptBefore} />
							</motion.div>
						</div>
						<div className={styles["transcript-arrow"]} aria-hidden="true">→</div>
						<div className={`${styles["transcript-panel"]} ${styles["transcript-panel--after"]}`}>
							<span className={styles["transcript-chip"]}>After</span>
							<Text size="sm" className={styles["transcript-heading"]}>Planner7 AI output</Text>
							<motion.div
								initial={{ opacity: 0, x: 10 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.35, delay: 0.08 }}
							>
								<LexicalPreview structuredData={{ blocks: transcriptAfter }} />
							</motion.div>
						</div>
					</motion.div>
				</section>

				<section className={styles["how-it-works"]} ref={stepsRef}>
					<Text size="sm" fontWeight={700} className={styles["section-label"]}>How it works</Text>
					<Headline as="h2" className={styles["section-title"]}>
						Get value on day one
					</Headline>
					<motion.div
						className={styles.steps}
						initial="hidden"
						animate={stepsInView ? "visible" : "hidden"}
						variants={containerVariants}
					>
						{steps.map((step, index) => (
							<motion.div key={step.title} className={styles.step} variants={cardVariants}>
								<div className={styles["step-number"]}>{index + 1}</div>
								<div className={styles["step-content"]}>
									<Text size="base" fontWeight={600} className={styles["step-title"]}>{step.title}</Text>
									<Text size="sm" className={styles["step-description"]}>{step.description}</Text>
								</div>
							</motion.div>
						))}
					</motion.div>
				</section>
				<section className={styles["cta-section"]} ref={ctaRef}>
					<motion.section
						className={styles["cta-banner"]}
						initial="hidden"
						animate={ctaInView ? "visible" : "hidden"}
						variants={{
							hidden: { scale: 0.9, opacity: 0 },
							visible: {
								scale: 1,
								opacity: 1,
								transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
							},
						}}
					>
						<Headline as="h2" className={styles["cta-title"]}>
							Ready to plan at the speed of thought?
						</Headline>
						<Text size="base" className={styles["cta-subtitle"]}>
							Use AI voice notes to capture faster, structure better, and execute your week with less friction.
						</Text>
						<div className={styles["cta-button"]}>
							<MagneticButton>
								<Button href="/signup" variant="primary" fontWeight={700}>Get Started for Free</Button>
							</MagneticButton>
						</div>
					</motion.section>
				</section>
			</main>
			<footer className={styles.footer}>
				<div className={styles["footer-links"]}>
					<Link href="/privacy" className={styles["footer-link"]}>Privacy Policy</Link>
					<Link href="/terms" className={styles["footer-link"]}>Terms of Service</Link>
				</div>
			</footer>
		</>
	);
}
