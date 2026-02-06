import styles from "../legal/LegalPage.module.scss";

import { Headline } from "@atoms/Headline/Headline";
import { Text } from "@atoms/Text/Text";
import Link from "next/link";

export default function TermsPage() {
	return (
		<main className={styles.page}>
			<div className={styles.content}>
				<Headline as="h1" className={styles.title}>Terms of Service</Headline>
				<Text size="sm" className={styles.updated}>Last updated: February 6, 2026</Text>

				<section className={styles.intro}>
					<Text size="base" className={styles.paragraph}>
						Welcome to Planner7. These Terms of Service (&quot;Terms&quot;) govern your use of our weekly planning and
						productivity service. By creating an account or using Planner7, you agree to be bound by these Terms and our
						Privacy Policy. Please read them carefully.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>1. Acceptance of Terms</Headline>
					<Text size="base" className={styles.paragraph}>
						By accessing or using Planner7, you confirm that you accept these Terms and agree to comply with them. If
						you do not agree to these Terms, you must not use our service.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>2. Eligibility</Headline>
					<Text size="base" className={styles.paragraph}>
						You must be at least 13 years old to use Planner7. If you are under 18, you confirm that you have your
						parent or guardian&apos;s permission to use the service. If your local law requires a higher minimum age,
						that higher age applies. By using Planner7, you represent and warrant that you meet these eligibility
						requirements.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>3. Your Account</Headline>

					<div className={styles.subsection}>
						<Headline as="h3" className={styles.subsectionTitle}>Account Registration</Headline>
						<Text size="base" className={styles.paragraph}>
							To use Planner7, you must create an account by providing accurate and complete information, including a
							valid email address. You agree to keep your account information current and accurate.
						</Text>
					</div>

					<div className={styles.subsection}>
						<Headline as="h3" className={styles.subsectionTitle}>Account Security</Headline>
						<Text size="base" className={styles.paragraph}>
							You are responsible for maintaining the confidentiality of your account credentials and for all activities
							that occur under your account. You agree to:
						</Text>
						<ul className={styles.list}>
							<li>Use a strong password and keep it secure</li>
							<li>Not share your account credentials with others</li>
							<li>Notify us immediately of any unauthorized access to your account</li>
							<li>Take responsibility for all activity under your account, whether authorized or not</li>
						</ul>
					</div>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>4. Acceptable Use</Headline>
					<Text size="base" className={styles.paragraph}>
						You agree to use Planner7 only for lawful purposes and in accordance with these Terms. You agree not to:
					</Text>
					<ul className={styles.list}>
						<li>Violate any applicable laws, regulations, or third-party rights</li>
						<li>Use the service to transmit harmful, offensive, or illegal content</li>
						<li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
						<li>Interfere with or disrupt the service, servers, or networks</li>
						<li>Use automated systems (bots, scrapers) to access the service without permission</li>
						<li>Reverse engineer, decompile, or attempt to extract the source code</li>
						<li>Resell, redistribute, or commercially exploit the service</li>
						<li>Upload viruses, malware, or any malicious code</li>
						<li>Impersonate any person or entity or misrepresent your affiliation</li>
					</ul>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>5. Your Content</Headline>
					<Text size="base" className={styles.paragraph}>
						You retain all ownership rights to the content you create and store in Planner7, including notes, tasks, and
						planning data (&quot;Your Content&quot;). By using our service, you grant us a limited license to host,
						store, and display Your Content solely to provide you with the service.
					</Text>
					<Text size="base" className={styles.paragraph}>
						You are solely responsible for Your Content and the consequences of sharing it. You represent that you own
						or have the necessary rights to all Your Content and that Your Content does not violate any laws or infringe
						on any third-party rights.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>6. Intellectual Property</Headline>
					<Text size="base" className={styles.paragraph}>
						The Planner7 service, including its software, design, features, text, graphics, and other content (excluding
						Your Content), is owned by Planner7 and protected by copyright, trademark, and other intellectual property
						laws. You may not copy, modify, distribute, sell, or lease any part of our service without our express
						written permission.
					</Text>
					<Text size="base" className={styles.paragraph}>
						We grant you a limited, non-exclusive, non-transferable license to access and use Planner7 for your personal
						planning and productivity needs.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>7. Subscription and Payment</Headline>
					<Text size="base" className={styles.paragraph}>
						Some features of Planner7 may require a paid subscription. If you subscribe to a paid plan:
					</Text>
					<ul className={styles.list}>
						<li>You agree to pay all fees associated with your subscription</li>
						<li>Subscriptions automatically renew unless cancelled before the renewal date</li>
						<li>You can cancel your subscription at any time through your account settings</li>
						<li>Refunds are provided at our discretion in accordance with applicable law</li>
						<li>We may change pricing with reasonable notice to existing subscribers</li>
					</ul>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>8. Service Availability</Headline>
					<Text size="base" className={styles.paragraph}>
						We strive to keep Planner7 available and reliable. However, we do not guarantee that the service will be
						uninterrupted, timely, secure, or error-free. We may modify, suspend, or discontinue any part of the service
						at any time with or without notice.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>9. Termination</Headline>
					<Text size="base" className={styles.paragraph}>
						You may stop using Planner7 and delete your account at any time. We reserve the right to suspend or
						terminate your account if you violate these Terms, engage in fraudulent activity, or for any other reason at
						our discretion.
					</Text>
					<Text size="base" className={styles.paragraph}>
						Upon termination, your right to use the service will immediately cease. We may delete Your Content in
						accordance with our data retention policies as described in our Privacy Policy.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>10. Disclaimers</Headline>
					<Text size="base" className={styles.paragraph}>
						PLANNER7 IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY
						KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
						INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
					</Text>
					<Text size="base" className={styles.paragraph}>
						We do not warrant that the service will be error-free, secure, or uninterrupted, or that defects will be
						corrected. You use the service at your own risk.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>11. Limitation of Liability</Headline>
					<Text size="base" className={styles.paragraph}>
						TO THE MAXIMUM EXTENT PERMITTED BY LAW, PLANNER7 AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND PARTNERS SHALL
						NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF
						PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.
					</Text>
					<Text size="base" className={styles.paragraph}>
						In jurisdictions that do not allow the exclusion or limitation of liability for consequential or incidental
						damages, our liability shall be limited to the maximum extent permitted by law.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>12. Indemnification</Headline>
					<Text size="base" className={styles.paragraph}>
						You agree to indemnify, defend, and hold harmless Planner7 and its affiliates from any claims, liabilities,
						damages, losses, and expenses arising out of or related to your use of the service, violation of these
						Terms, or infringement of any third-party rights.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>13. Changes to These Terms</Headline>
					<Text size="base" className={styles.paragraph}>
						We may update these Terms from time to time to reflect changes in our service, legal requirements, or
						business practices. We will notify you of significant changes by email or through a notice in the app. Your
						continued use of Planner7 after changes take effect constitutes acceptance of the updated Terms.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>14. Governing Law and Disputes</Headline>
					<Text size="base" className={styles.paragraph}>
						These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from
						these Terms or your use of Planner7 shall be resolved through good faith negotiations or, if necessary,
						through the courts of appropriate jurisdiction.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>15. General Provisions</Headline>
					<Text size="base" className={styles.paragraph}>
						If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full
						effect. Our failure to enforce any right or provision of these Terms will not be considered a waiver of
						those rights. These Terms constitute the entire agreement between you and Planner7 regarding the service.
					</Text>
				</section>

				<section className={styles.section}>
					<Headline as="h2" className={styles.sectionTitle}>16. Contact Us</Headline>
					<Text size="base" className={styles.paragraph}>
						If you have questions about these Terms, please contact us at:
					</Text>
					<Text size="base" className={styles.paragraph}>
						Email: <a href="mailto:support@planner7.com" className={styles.emailLink}>support@planner7.com</a>
					</Text>
				</section>

				<div className={styles.links}>
					<Link href="/privacy" className={styles.link}>Privacy Policy</Link>
					<Link href="/" className={styles.link}>Back to home</Link>
				</div>
			</div>
		</main>
	);
}
