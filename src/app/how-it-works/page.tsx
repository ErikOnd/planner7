import { Headline } from "@atoms/Headline/Headline";
import { Icon, IconName } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";
import styles from "@components/MarketingPage/MarketingPage.module.scss";
import { MarketingPageShell } from "@components/MarketingPage/MarketingPageShell";
import type { Metadata } from "next";
import Link from "next/link";

const steps = [
	{
		title: "Capture work in the backlog",
		description:
			"Start by collecting commitments, tasks, and loose responsibilities in one place so they stop competing for attention in your head.",
	},
	{
		title: "Pull only the right work into the week",
		description:
			"Choose what genuinely deserves time this week instead of dragging the entire backlog into your current plan.",
	},
	{
		title: "Write the daily plan with real context",
		description:
			"Use each day’s note area to outline approach, dependencies, reminders, and the sequence that will make execution smoother.",
	},
	{
		title: "Review, adjust, and carry forward intelligently",
		description:
			"At the end of the week, move unfinished work with intention rather than letting old tasks silently pile up.",
	},
];

const workflowOutcomes: Array<{
	icon: IconName;
	title: string;
	description: string;
}> = [
	{
		icon: "calendar",
		title: "Faster daily startup",
		description:
			"Because the thinking already happened during planning, each day begins with a smaller gap between opening the planner and starting the work.",
	},
	{
		icon: "connectors",
		title: "Better continuity through the week",
		description:
			"Context lives beside the plan, which makes interruptions less expensive and midweek adjustments far easier to absorb.",
	},
	{
		icon: "star",
		title: "More realistic commitments",
		description:
			"The weekly view forces tradeoffs into the open so you can commit to less, but finish more of what matters.",
	},
];

const gettingStarted = [
	{
		title: "Start with one weekly planning pass",
		description:
			"You do not need a complex system on day one. One pass through the week and a short backlog is enough to make Planner7 useful.",
	},
	{
		title: "Add detail only where the work benefits from it",
		description:
			"Some days need a short list. Others need written sequencing and context. Planner7 supports both without forcing the same depth everywhere.",
	},
];

export const metadata: Metadata = {
	title: "How It Works",
	description: "See how Planner7 turns backlog capture, weekly planning, and daily notes into one repeatable workflow.",
	alternates: {
		canonical: "/how-it-works",
	},
};

export default function HowItWorksPage() {
	return (
		<MarketingPageShell
			eyebrow="How It Works"
			title="A simple weekly loop that turns scattered tasks into a plan you can actually execute."
			description="Planner7 works best as a repeatable rhythm: collect work, decide what belongs this week, write enough daily context, and carry the right things forward."
			ctaTitle="Ready to try the workflow in your own week?"
			ctaDescription="You do not need a complicated setup. Start with a backlog, build a weekly plan, and let the daily notes do the rest."
		>
			<section className={styles.section}>
				<div className={styles.sectionHeader}>
					<Text size="sm" fontWeight={700} className={styles.sectionEyebrow}>The weekly loop</Text>
					<Headline as="h2" className={styles.sectionTitle}>
						Four steps from backlog to clear daily execution
					</Headline>
				</div>
				<div className={styles.timeline}>
					{steps.map((step, index) => (
						<article key={step.title} className={styles.timelineItem}>
							<div className={styles.timelineNumber}>{index + 1}</div>
							<div className={styles.stack}>
								<Text size="base" fontWeight={600} className={styles.cardTitle}>{step.title}</Text>
								<Text size="sm" className={styles.timelineText}>{step.description}</Text>
							</div>
						</article>
					))}
				</div>
			</section>

			<section className={styles.section}>
				<div className={styles.sectionHeader}>
					<Text size="sm" fontWeight={700} className={styles.sectionEyebrow}>What changes</Text>
					<Headline as="h2" className={styles.sectionTitle}>
						Why this workflow tends to feel calmer than a traditional to-do list
					</Headline>
				</div>
				<div className={styles.grid}>
					{workflowOutcomes.map((item) => (
						<article key={item.title} className={styles.card}>
							<div className={styles.cardIcon}>
								<Icon name={item.icon} size={22} />
							</div>
							<Text size="base" fontWeight={600} className={styles.cardTitle}>{item.title}</Text>
							<Text size="sm" className={styles.cardText}>{item.description}</Text>
						</article>
					))}
				</div>
			</section>

			<section className={styles.section}>
				<div className={styles.sectionHeader}>
					<Text size="sm" fontWeight={700} className={styles.sectionEyebrow}>Start small</Text>
					<Headline as="h2" className={styles.sectionTitle}>
						Planner7 is meant to be adoptable, not overwhelming
					</Headline>
				</div>
				<div className={styles.gridTwo}>
					{gettingStarted.map((item) => (
						<article key={item.title} className={styles.card}>
							<Text size="base" fontWeight={600} className={styles.cardTitle}>{item.title}</Text>
							<Text size="sm" className={styles.cardText}>{item.description}</Text>
						</article>
					))}
				</div>
				<Text size="base" className={styles.sectionIntro}>
					If you still have questions about the product, the next stop is the{" "}
					<Link href="/faq" className={styles.inlineLink}>FAQ</Link>.
				</Text>
			</section>
		</MarketingPageShell>
	);
}
