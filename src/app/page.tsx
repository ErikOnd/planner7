import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { LandingPage } from "@components/LandingPage/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Weekly Planner with Rich Daily Notes and Task Backlog",
	description: SITE_DESCRIPTION,
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: `${SITE_NAME} | Weekly Planner with Rich Daily Notes and Task Backlog`,
		description: SITE_DESCRIPTION,
		url: "/",
	},
};

export default async function RootPage() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE_NAME,
		url: `${SITE_URL}/`,
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<LandingPage />
		</>
	);
}
