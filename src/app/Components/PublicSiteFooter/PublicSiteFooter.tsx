import { MARKETING_NAV_LINKS } from "@/lib/site";
import Link from "next/link";
import styles from "./PublicSiteFooter.module.scss";

const footerLinks = [
	...MARKETING_NAV_LINKS,
	{ href: "/privacy", label: "Privacy Policy" },
	{ href: "/terms", label: "Terms of Service" },
];

export function PublicSiteFooter() {
	return (
		<footer className={styles.footer}>
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
