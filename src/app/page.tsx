import { LandingPage } from "@components/LandingPage/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Planner7",
	description: "Planner7 is a focused weekly planner with rich daily notes and backlog task management.",
};

export default async function RootPage() {
	return <LandingPage />;
}
