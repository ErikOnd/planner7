import styles from "./LoginPage.module.scss";

import { LoginForm } from "@components/auth/LoginForm";
import { createClient } from "@utils/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Log In",
	description: "Log in to your Planner7 account.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function LoginPage() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getUser();

	if (!error && data?.user) {
		redirect("/app");
	}

	return (
		<main className={styles["login-holder"]}>
			<LoginForm />
		</main>
	);
}
