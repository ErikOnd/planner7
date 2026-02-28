import { LandingPage } from "@components/LandingPage/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Planner7",
	description:
		"Planner7 turns voice into structured daily notes with headings, lists, and checkboxes in one focused weekly planner.",
};

export default async function RootPage() {
	return <LandingPage />;
}
