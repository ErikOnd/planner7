import { DocsModeShell } from "@components/DocsMode/DocsModeShell";
import { createClient } from "@utils/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Docs",
	description: "A focused documents workspace inside Planner7.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function DocsPage() {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();

	if (error || !data?.user) {
		redirect("/login");
	}

	return <DocsModeShell />;
}
