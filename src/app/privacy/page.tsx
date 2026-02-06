import styles from "../legal/LegalPage.module.scss";

import { Headline } from "@atoms/Headline/Headline";
import { Text } from "@atoms/Text/Text";
import Link from "next/link";

export default function PrivacyPage() {
	return (
		<main className={styles.page}>
			<div className={styles.content}>
				<Headline as="h1" className={styles.title}>Privacy Policy</Headline>
				<Text size="sm" className={styles.updated}>Last updated: February 6, 2026</Text>

				<section className={styles.intro}>
					<Text size="base" className={styles.paragraph}>
						At Planner7, your privacy matters. This Privacy Policy explains what information we collect, how we use it,
						and the choices you have about your data. By using Planner7, you agree to the practices described in this
						policy.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>1. Information We Collect</Headline>

					<div className={styles.subsection}>
						<Headline as="h3" className={styles.subsectionTitle}>Information You Provide</Headline>
						<Text size="base" className={styles.paragraph}>
							When you create an account, we collect your name, email address, and password. As you use Planner7, you
							create and store content including notes, tasks, events, and other planning data.
						</Text>
					</div>

					<div className={styles.subsection}>
						<Headline as="h3" className={styles.subsectionTitle}>Automatically Collected Information</Headline>
						<Text size="base" className={styles.paragraph}>
							We collect technical information to operate and secure our service, including your IP address, browser
							type, device information, and usage patterns such as login times and feature interactions.
						</Text>
					</div>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>2. How We Use Your Information</Headline>
					<Text size="base" className={styles.paragraph}>
						We use the information we collect to:
					</Text>
					<ul className={styles.list}>
						<li>Provide, maintain, and improve the Planner7 service</li>
						<li>Authenticate your identity and protect your account security</li>
						<li>Sync your data across devices and ensure reliable access</li>
						<li>Respond to your support requests and communications</li>
						<li>Detect, prevent, and address technical issues, fraud, or security threats</li>
						<li>Send important service updates and security notifications</li>
						<li>Understand how you use Planner7 to improve features and user experience</li>
					</ul>
					<Text size="base" className={styles.paragraph}>
						<strong>
							We do not use your data to develop, train, or improve artificial intelligence or machine learning models.
						</strong>{" "}
						Your planning content remains private and is never used for purposes beyond providing you with the service.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>3. Data Sharing and Service Providers</Headline>
					<Text size="base" className={styles.paragraph}>
						We work with trusted service providers to operate Planner7. These providers may process your data on our
						behalf for purposes such as:
					</Text>
					<ul className={styles.list}>
						<li>Authentication services (e.g., Supabase for secure login)</li>
						<li>Cloud hosting and database infrastructure</li>
						<li>Analytics and performance monitoring</li>
						<li>Customer support tools</li>
					</ul>
					<Text size="base" className={styles.paragraph}>
						<strong>We never sell your personal information.</strong>{" "}
						We only share data with service providers who are contractually obligated to protect your information and
						use it solely to provide services on our behalf. We may also disclose information if required by law or to
						protect our rights and safety.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>4. Data Security</Headline>
					<Text size="base" className={styles.paragraph}>
						We implement industry-standard security measures to protect your data, including encryption in transit (TLS)
						and at rest. However, no method of transmission or storage is completely secure. While we strive to protect
						your information, we cannot guarantee absolute security.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>5. Data Retention and Deletion</Headline>
					<Text size="base" className={styles.paragraph}>
						We retain your account information and content for as long as your account is active and as necessary to
						provide you with our services. If you delete your account, we will delete or anonymize your personal data
						within 90 days, unless we are required to retain certain information for legal, tax, or regulatory purposes.
					</Text>
					<Text size="base" className={styles.paragraph}>
						You can request account deletion at any time by contacting us at{" "}
						<a href="mailto:support@planner7.com" className={styles.emailLink}>support@planner7.com</a>.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>6. Your Privacy Rights</Headline>
					<Text size="base" className={styles.paragraph}>
						Depending on your location, you may have certain rights regarding your personal data:
					</Text>
					<ul className={styles.list}>
						<li>
							<strong>Access:</strong> Request a copy of the personal data we hold about you
						</li>
						<li>
							<strong>Correction:</strong> Update or correct inaccurate information
						</li>
						<li>
							<strong>Deletion:</strong> Request deletion of your personal data
						</li>
						<li>
							<strong>Export:</strong> Download your data in a portable format
						</li>
						<li>
							<strong>Objection:</strong> Object to certain processing activities
						</li>
						<li>
							<strong>Restriction:</strong> Request that we limit how we use your data
						</li>
					</ul>
					<Text size="base" className={styles.paragraph}>
						To exercise these rights, please contact us at{" "}
						<a href="mailto:support@planner7.com" className={styles.emailLink}>support@planner7.com</a>.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>7. Cookies and Tracking Technologies</Headline>
					<Text size="base" className={styles.paragraph}>
						We use cookies and similar technologies to maintain your session, remember your preferences, and analyze how
						you use our service. You can control cookies through your browser settings, though some features may not
						function properly if cookies are disabled.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>8. International Data Transfers</Headline>
					<Text size="base" className={styles.paragraph}>
						Your data may be processed and stored in countries other than your own. We ensure appropriate safeguards are
						in place to protect your information in accordance with this Privacy Policy.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>9. Children&apos;s Privacy</Headline>
					<Text size="base" className={styles.paragraph}>
						Planner7 is not intended for children under 13 years of age. We do not knowingly collect personal
						information from children. If you believe we have collected information from a child, please contact us
						immediately.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>10. Changes to This Policy</Headline>
					<Text size="base" className={styles.paragraph}>
						We may update this Privacy Policy from time to time to reflect changes in our practices or for legal,
						operational, or regulatory reasons. We will notify you of significant changes by email or through a notice
						in the app. Your continued use of Planner7 after changes take effect constitutes acceptance of the updated
						policy.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>11. Contact Us</Headline>
					<Text size="base" className={styles.paragraph}>
						If you have questions about this Privacy Policy or how we handle your data, please contact us at:
					</Text>
					<Text size="base" className={styles.paragraph}>
						Email: <a href="mailto:support@planner7.com" className={styles.emailLink}>support@planner7.com</a>
					</Text>
				</section>

				<div className={styles.links}>
					<Link href="/terms" className={styles.link}>Terms of Service</Link>
					<Link href="/" className={styles.link}>Back to home</Link>
				</div>
			</div>
		</main>
	);
}
