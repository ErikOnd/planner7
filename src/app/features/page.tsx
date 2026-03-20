import { Headline } from "@atoms/Headline/Headline";
import { Icon, IconName } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";
import styles from "@components/MarketingPage/MarketingPage.module.scss";
import { MarketingPageShell } from "@components/MarketingPage/MarketingPageShell";
import type { Metadata } from "next";
import Link from "next/link";

const featureCards: Array<{
	icon: IconName;
	title: string;
	description: string;
}> = [
	{
		icon: "editor",
		title: "Rich daily notes",
		description:
			"Each day has enough room for real thinking, sequencing, and written context instead of collapsing everything into a single checkbox.",
	},
	{
		icon: "week",
		title: "Weekly focus view",
		description:
			"See the whole week in one place so priorities, tradeoffs, and workload stay visible while you decide what deserves attention.",
	},
	{
		icon: "pencil",
		title: "Backlog that stays usable",
		description:
			"Capture tasks quickly, keep them organized, and pull the right work into the week when it is actually ready to be done.",
	},
];

const planningPrinciples = [
	{
		title: "Context stays attached to the work",
		description:
			"Tasks do not float around without meaning. Planner7 keeps notes and execution context close enough that starting work feels lighter.",
	},
	{
		title: "Planning happens before the day gets noisy",
		description:
			"Use the weekly view to make decisions once, then start each day with a clearer plan instead of rebuilding focus from scratch.",
	},
];

const outcomes: Array<{
	icon: IconName;
	title: string;
	description: string;
}> = [
	{
		icon: "calendar",
		title: "Plan the whole week in one pass",
		description:
			"Build a realistic weekly plan without losing sight of what still belongs in backlog and what actually needs to move now.",
	},
	{
		icon: "connectors",
		title: "Move from intent to execution faster",
		description:
			"Turn vague responsibilities into concrete daily plans with headings, notes, and task context already in place.",
	},
	{
		icon: "star",
		title: "Reduce task-list churn",
		description:
			"Stop rewriting the same priorities every day and start carrying forward only the work that still matters.",
	},
];

export const metadata: Metadata = {
	title: "Features",
	description: "Explore Planner7 features for weekly planning, rich daily notes, and backlog task management.",
	alternates: {
		canonical: "/features",
	},
};

export default function FeaturesPage() {
	return (
		<MarketingPageShell
			eyebrow="Features"
			title="Everything you need to plan the week without losing the detail of the day."
			description="Planner7 combines a weekly overview, rich daily notes, and a task backlog into one planning surface built for clarity before action."
			ctaTitle="See how the workflow fits together."
			ctaDescription="If the product philosophy makes sense, the next step is understanding how the weekly loop works in practice."
		>
			<section className={styles.section}>
				<div className={styles.sectionHeader}>
					<Text size="sm" fontWeight={700} className={styles.sectionEyebrow}>Core capabilities</Text>
					<Headline as="h2" className={styles.sectionTitle}>
						A planner designed around decisions, not just capture
					</Headline>
					<Text size="base" className={styles.sectionIntro}>
						Planner7 gives you the structure to think clearly before work starts moving. The product is centered on
						weekly planning, daily context, and a backlog that remains useful instead of becoming a graveyard.
					</Text>
				</div>
				<div className={styles.grid}>
					{featureCards.map((card) => (
						<article key={card.title} className={styles.card}>
							<div className={styles.cardIcon}>
								<Icon name={card.icon} size={22} />
							</div>
							<Text size="base" fontWeight={600} className={styles.cardTitle}>{card.title}</Text>
							<Text size="sm" className={styles.cardText}>{card.description}</Text>
						</article>
					))}
				</div>
			</section>

			<section className={styles.section}>
				<div className={styles.sectionHeader}>
					<Text size="sm" fontWeight={700} className={styles.sectionEyebrow}>Why it feels different</Text>
					<Headline as="h2" className={styles.sectionTitle}>
						Planner7 is built to keep planning friction low and decision quality high
					</Headline>
				</div>
				<div className={styles.gridTwo}>
					{planningPrinciples.map((item) => (
						<article key={item.title} className={styles.card}>
							<Text size="base" fontWeight={600} className={styles.cardTitle}>{item.title}</Text>
							<Text size="sm" className={styles.cardText}>{item.description}</Text>
						</article>
					))}
				</div>
			</section>

			<section className={styles.section}>
				<div className={styles.sectionHeader}>
					<Text size="sm" fontWeight={700} className={styles.sectionEyebrow}>What this enables</Text>
					<Headline as="h2" className={styles.sectionTitle}>
						A calmer weekly workflow with less re-planning and more forward motion
					</Headline>
				</div>
				<div className={styles.grid}>
					{outcomes.map((item) => (
						<article key={item.title} className={styles.card}>
							<div className={styles.cardIcon}>
								<Icon name={item.icon} size={22} />
							</div>
							<Text size="base" fontWeight={600} className={styles.cardTitle}>{item.title}</Text>
							<Text size="sm" className={styles.cardText}>{item.description}</Text>
						</article>
					))}
				</div>
				<Text size="base" className={styles.sectionIntro}>
					Want to see how those pieces turn into an actual planning rhythm? Read{" "}
					<Link href="/how-it-works" className={styles.inlineLink}>How It Works</Link>.
				</Text>
			</section>
		</MarketingPageShell>
	);
}
