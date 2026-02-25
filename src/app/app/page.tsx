import HomePage from "@components/Homepage/HomePage";
import { createClient } from "@utils/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Planner7 – Weekly Overview",
	description:
		"Plan your week with a rich text planning area for each day plus task tracking in one clear weekly overview.",
};

export default async function ProtectedPage() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getUser();

	if (error || !data?.user) {
		redirect("/login");
	}

	return <HomePage />;
}
