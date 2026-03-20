import { MARKETING_NAV_LINKS, SITE_NAME } from "@/lib/site";
import { Text } from "@atoms/Text/Text";
import Link from "next/link";
import styles from "./PublicSiteFooter.module.scss";

const footerLinks = [
	...MARKETING_NAV_LINKS,
	{ href: "/privacy", label: "Privacy" },
	{ href: "/terms", label: "Terms" },
];

export function PublicSiteFooter() {
	return (
		<footer className={styles.footer}>
			<Text size="sm" className={styles.footerMeta}>
				{SITE_NAME} is built for people who want a calmer weekly planning workflow.
			</Text>
			<div className={styles.footerLinks}>
				{footerLinks.map((link) => (
					<Link key={link.href} href={link.href} className={styles.footerLink}>
						{link.label}
					</Link>
				))}
			</div>
		</footer>
	);
}
