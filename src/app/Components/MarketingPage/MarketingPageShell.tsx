import { SITE_NAME } from "@/lib/site";
import { Button } from "@atoms/Button/Button";
import { Headline } from "@atoms/Headline/Headline";
import { Text } from "@atoms/Text/Text";
import { PublicSiteFooter } from "@components/PublicSiteFooter/PublicSiteFooter";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import styles from "./MarketingPage.module.scss";

type MarketingPageShellProps = {
	eyebrow: string;
	title: string;
	description: string;
	children: ReactNode;
	ctaTitle?: string;
	ctaDescription?: string;
};

export function MarketingPageShell({
	eyebrow,
	title,
	description,
	children,
	ctaTitle = "Start planning with a weekly system that keeps context attached to the work.",
	ctaDescription = "Create your workspace, pull in the right tasks, and give each day enough room for real planning.",
}: MarketingPageShellProps) {
	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<nav className={styles.nav} aria-label="Planner7 public navigation">
					<Link href="/" className={styles.logo} aria-label={`${SITE_NAME} home`}>
						<Image
							src="/logo-full-dark.svg"
							alt={`${SITE_NAME} logo`}
							width={272}
							height={50}
							className={styles.logoIcon}
						/>
					</Link>
					<div className={styles.navActions}>
						<Button href="/signup" variant="primary" fontWeight={700}>Get Started</Button>
					</div>
				</nav>
			</header>

			<main className={styles.main}>
				<section className={styles.hero}>
					<Text size="sm" fontWeight={700} className={styles.eyebrow}>{eyebrow}</Text>
					<Headline as="h1" className={styles.title}>{title}</Headline>
					<Text size="lg" className={styles.subtitle}>{description}</Text>
					<div className={styles.heroActions}>
						<Button href="/signup" variant="primary" fontWeight={700}>Create Your Workspace</Button>
					</div>
				</section>

				{children}

				<section className={styles.cta}>
					<Headline as="h2" className={styles.ctaTitle}>{ctaTitle}</Headline>
					<Text size="base" className={styles.ctaText}>{ctaDescription}</Text>
					<Button href="/signup" variant="primary" fontWeight={700}>Get Started for Free</Button>
				</section>
			</main>
			<PublicSiteFooter />
		</div>
	);
}
