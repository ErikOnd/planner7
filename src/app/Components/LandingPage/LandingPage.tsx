"use client";

import styles from "./LandingPage.module.scss";

import {Button} from "@atoms/Button/Button";
import {Headline} from "@atoms/Headline/Headline";
import {Icon} from "@atoms/Icons/Icon";
import {Text} from "@atoms/Text/Text";
import {motion, useInView} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {useRef} from "react";
import {MagneticButton} from "./MagneticButton";
import {TypingAnimation} from "./TypingAnimation";

const features = [
	{
		icon: "pencil" as const,
		title: "Daily Notes",
		description:
			"Capture your thoughts and plans for each day in one place. Stay focused and organized with a clean writing space.",
	},
	{
		icon: "star" as const,
		title: "Task Management",
		description: "Create, organize, and track your tasks with ease. Prioritize what matters and get things done.",
	},
	{
		icon: "calendar" as const,
		title: "Weekly Overview",
		description: "See your entire week at a glance and stay organized. Plan ahead and make the most of every day.",
	},
];

const steps = [
	{
		title: "Create your account",
		description: "Sign up in seconds, no credit card needed. Get started right away.",
	},
	{
		title: "Set up your week",
		description: "Pick your dates and start organizing. Everything is ready for you.",
	},
	{
		title: "Plan every day",
		description: "Write notes, add tasks, and stay on track. Make every day count.",
	},
];

export function LandingPage() {
	const featuresRef = useRef(null);
	const stepsRef = useRef(null);
	const ctaRef = useRef(null);

	const featuresInView = useInView(featuresRef, {once: true, margin: "-100px"});
	const stepsInView = useInView(stepsRef, {once: true, margin: "-100px"});
	const ctaInView = useInView(ctaRef, {once: true, margin: "-100px"});

	const navVariants = {
		hidden: {y: -20, opacity: 0},
		visible: {
			y: 0,
			opacity: 1,
			transition: {duration: 0.6, ease: [0.16, 1, 0.3, 1] as const},
		},
	};

	const heroVariants = {
		hidden: {opacity: 0},
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
				delayChildren: 0.3,
			},
		},
	};

	const heroItemVariants = {
		hidden: {y: 30, opacity: 0},
		visible: {
			y: 0,
			opacity: 1,
			transition: {duration: 0.6, ease: [0.16, 1, 0.3, 1] as const},
		},
	};

	const containerVariants = {
		hidden: {opacity: 0},
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
				delayChildren: 0.2,
			},
		},
	};

	const cardVariants = {
		hidden: {y: 40, opacity: 0, scale: 0.95},
		visible: {
			y: 0,
			opacity: 1,
			scale: 1,
			transition: {duration: 0.5, ease: [0.16, 1, 0.3, 1] as const},
		},
	};

	return (
		<div>
			{/* Nav */}
			<motion.nav
				className={styles.nav}
				initial="hidden"
				animate="visible"
				variants={navVariants}
			>
				<Link href="/" className={styles.logo}>
					<Image src="/logo-mark.svg" alt="Planner7 logo" width={96} height={96}
					       className={styles["logo-icon"]}/>
				</Link>
				<div className={styles["nav-actions"]}>
					<MagneticButton>
						<Link href="/signup">
							<Button variant="primary" fontWeight={700}>Get Started</Button>
						</Link>
					</MagneticButton>
				</div>
			</motion.nav>

			<motion.section
				className={styles.hero}
				initial="hidden"
				animate="visible"
				variants={heroVariants}
			>
				<motion.div variants={heroItemVariants}>
					<Headline as="h1" className={styles["hero-headline"]}>
						Plan your time,<br/>
						<TypingAnimation/>
					</Headline>
				</motion.div>
				<motion.div variants={heroItemVariants}>
					<Text size="lg" className={styles["hero-subtitle"]}>
						A clean, distraction-free space to organize your days, manage tasks, and stay on top of what
						matters.
					</Text>
				</motion.div>
			</motion.section>

			<section className={styles.features} ref={featuresRef}>
				<Text size="sm" className={styles["section-label"]}>What you get</Text>
				<Headline as="h2" className={styles["section-title"]}>
					Everything you need to stay organized
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
								<Icon name={feature.icon} size={22}/>
							</div>
							<Text size="base" fontWeight={600}
							      className={styles["feature-title"]}>{feature.title}</Text>
							<Text size="sm" className={styles["feature-description"]}>{feature.description}</Text>
						</motion.div>
					))}
				</motion.div>
			</section>

			<section className={styles["how-it-works"]} ref={stepsRef}>
				<Text size="sm" className={styles["section-label"]}>How it works</Text>
				<Headline as="h2" className={styles["section-title"]}>
					Get started in minutes
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
						hidden: {scale: 0.9, opacity: 0},
						visible: {
							scale: 1,
							opacity: 1,
							transition: {duration: 0.6, ease: [0.16, 1, 0.3, 1] as const},
						},
					}}
				>
					<Headline as="h2" className={styles["cta-title"]}>
						Ready to take control of your week?
					</Headline>
					<Text size="base" className={styles["cta-subtitle"]}>
						Join our community of people who already use Planner7 to organize their lives.
					</Text>
					<div className={styles["cta-button"]}>
						<MagneticButton>
							<Link href="/signup">
								<Button variant="primary" fontWeight={700}>Get Started for Free</Button>
							</Link>
						</MagneticButton>
					</div>
				</motion.section>
			</section>
			<footer className={styles.footer}>
				<div className={styles["footer-links"]}>
					<Link href="/privacy" className={styles["footer-link"]}>Privacy Policy</Link>
					<Link href="/terms" className={styles["footer-link"]}>Terms of Service</Link>
				</div>
			</footer>
		</div>
	);
}
