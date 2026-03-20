import { Headline } from "@atoms/Headline/Headline";
import { Text } from "@atoms/Text/Text";
import styles from "@components/MarketingPage/MarketingPage.module.scss";
import { MarketingPageShell } from "@components/MarketingPage/MarketingPageShell";
import type { Metadata } from "next";
import Link from "next/link";

const faqItems = [
	{
		question: "What is Planner7?",
		answer:
			"Planner7 is a focused weekly planner that combines backlog tasks, a weekly overview, and rich daily notes in one workspace.",
	},
	{
		question: "How is Planner7 different from a standard to-do list?",
		answer:
			"Traditional to-do lists are good at capture. Planner7 is built for planning. It gives each day space for written context, sequencing, and decisions instead of only collecting tasks.",
	},
	{
		question: "Do I need an account to use Planner7?",
		answer:
			"Yes. Planner7 is account-based so your planning workspace, notes, and tasks can stay tied to you and be available when you return.",
	},
	{
		question: "Does Planner7 have pricing yet?",
		answer:
			"Not yet. Pricing is still being finalized, so the current public site focuses on the workflow and core product experience rather than plan tiers.",
	},
	{
		question: "Can I use Planner7 on desktop and mobile?",
		answer:
			"Yes. Planner7 is designed to work across desktop and mobile, and it can also be installed as a web app for a more app-like experience.",
	},
	{
		question: "Is my planning data private?",
		answer:
			"Planner7 is built around private personal planning data. The public privacy policy explains how data is handled, including security and retention practices.",
	},
	{
		question: "Where can I read the legal details?",
		answer: "You can read the Privacy Policy and Terms of Service on the public site at any time.",
	},
];

export const metadata: Metadata = {
	title: "FAQ",
	description:
		"Read common questions about Planner7, including workflow, accounts, privacy, and current product availability.",
	alternates: {
		canonical: "/faq",
	},
};

export default function FAQPage() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqItems.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: item.answer,
			},
		})),
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<MarketingPageShell
				eyebrow="FAQ"
				title="Answers to the questions people ask before they commit to a new planning workflow."
				description="If you want the short version of what Planner7 is, how it works, and what is available now, this is the place to start."
				ctaTitle="Still deciding whether Planner7 fits the way you work?"
				ctaDescription="Review the features, understand the workflow, and start when the weekly planning model feels right for you."
			>
				<section className={styles.section}>
					<div className={styles.sectionHeader}>
						<Text size="sm" fontWeight={700} className={styles.sectionEyebrow}>Common questions</Text>
						<Headline as="h2" className={styles.sectionTitle}>
							Clear answers about the product and the current public offering
						</Headline>
					</div>
					<div className={styles.faqList}>
						{faqItems.map((item) => (
							<article key={item.question} className={styles.faqItem}>
								<Text size="base" fontWeight={600} className={styles.faqQuestion}>{item.question}</Text>
								<Text size="sm" className={styles.faqAnswer}>
									{item.question === "Is my planning data private?"
										? (
											<>
												Planner7 is built around private personal planning data. The public{" "}
												<Link href="/privacy" className={styles.inlineLink}>Privacy Policy</Link>{" "}
												explains how data is handled, including security and retention practices.
											</>
										)
										: item.question === "Where can I read the legal details?"
										? (
											<>
												You can read the <Link href="/privacy" className={styles.inlineLink}>Privacy Policy</Link> and
												{" "}
												<Link href="/terms" className={styles.inlineLink}>Terms of Service</Link>{" "}
												on the public site at any time.
											</>
										)
										: (
											item.answer
										)}
								</Text>
							</article>
						))}
					</div>
					<Text size="base" className={styles.sectionIntro}>
						If you want the broader product view first, start with{" "}
						<Link href="/features" className={styles.inlineLink}>Features</Link> or{" "}
						<Link href="/how-it-works" className={styles.inlineLink}>How It Works</Link>.
					</Text>
				</section>
			</MarketingPageShell>
		</>
	);
}
