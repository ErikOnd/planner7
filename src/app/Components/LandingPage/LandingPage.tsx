import styles from "./LandingPage.module.scss";

import { Button } from "@atoms/Button/Button";
import { Headline } from "@atoms/Headline/Headline";
import { Icon } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";
import Link from "next/link";
import Image from "next/image";
import { TypingAnimation } from "./TypingAnimation";

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
	return (
		<div>
			{/* Nav */}
			<nav className={styles.nav}>
				<Link href="/" className={styles.logo}>
					<Image src="/favicon.svg" alt="Planner7 logo" width={96} height={96} className={styles["logo-icon"]} />
				</Link>
				<div className={styles["nav-actions"]}>
					<Link href="/signup">
						<Button variant="primary" fontWeight={700}>Get Started</Button>
					</Link>
				</div>
			</nav>

			{/* Hero */}
			<section className={styles.hero}>
				<Headline as="h1" className={styles["hero-headline"]}>
					Plan your time,<br />
					<TypingAnimation />
				</Headline>
				<Text size="lg" className={styles["hero-subtitle"]}>
					A clean, distraction-free space to organize your days, manage tasks, and stay on top of what matters.
				</Text>
			</section>

			{/* Features */}
			<section className={styles.features}>
				<Text size="sm" className={styles["section-label"]}>What you get</Text>
				<Headline as="h2" className={styles["section-title"]}>
					Everything you need to stay organized
				</Headline>
				<div className={styles["feature-cards"]}>
					{features.map((feature) => (
						<div key={feature.title} className={styles["feature-card"]}>
							<div className={styles["feature-icon"]}>
								<Icon name={feature.icon} size={22} />
							</div>
							<Text size="base" fontWeight={600} className={styles["feature-title"]}>{feature.title}</Text>
							<Text size="sm" className={styles["feature-description"]}>{feature.description}</Text>
						</div>
					))}
				</div>
			</section>

			{/* How it works */}
			<section className={styles["how-it-works"]}>
				<Text size="sm" className={styles["section-label"]}>How it works</Text>
				<Headline as="h2" className={styles["section-title"]}>
					Get started in minutes
				</Headline>
				<div className={styles.steps}>
					{steps.map((step, index) => (
						<div key={step.title} className={styles.step}>
							<div className={styles["step-number"]}>{index + 1}</div>
							<div className={styles["step-content"]}>
								<Text size="base" fontWeight={600} className={styles["step-title"]}>{step.title}</Text>
								<Text size="sm" className={styles["step-description"]}>{step.description}</Text>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* CTA Banner */}
			<section className={styles["cta-banner"]}>
				<Headline as="h2" className={styles["cta-title"]}>
					Ready to take control of your week?
				</Headline>
				<Text size="base" className={styles["cta-subtitle"]}>
					Join our community of people who already use Planner7 to organize their lives.
				</Text>
				<div className={styles["cta-button"]}>
					<Link href="/signup">
						<Button variant="primary" fontWeight={700}>Get Started for Free</Button>
					</Link>
				</div>
			</section>

			<footer className={styles.footer}>
				<div className={styles["footer-brand"]}>
					<Image src="/favicon.svg" alt="Planner7 logo" width={24} height={24} className={styles["footer-logo"]} />
					<Text size="sm" className={styles["footer-text"]}>Planner7</Text>
				</div>
				<div className={styles["footer-links"]}>
					<Link href="/privacy" className={styles["footer-link"]}>Privacy Policy</Link>
					<Link href="/terms" className={styles["footer-link"]}>Terms of Service</Link>
				</div>
			</footer>
		</div>
	);
}
