import styles from "./SignUpPage.module.scss";

import { SignUpForm } from "@components/auth/SignUpForm";
import { createClient } from "@utils/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Sign Up",
	description: "Create a Planner7 account.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function SignUpPage() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getUser();

	if (!error && data?.user) {
		redirect("/app");
	}

	return (
		<main className={styles["signup-holder"]}>
			<SignUpForm />
		</main>
	);
}
