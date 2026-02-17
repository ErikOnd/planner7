import { LandingPage } from "@components/LandingPage/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Planner7",
	description:
		"Planner7 is a weekly planner with a rich text planning area for each day plus tasks. Plan your work, not just check boxes.",
};

export default async function RootPage() {
	return <LandingPage />;
}
