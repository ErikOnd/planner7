import styles from "./SignUpPage.module.scss";

import { SignUpForm } from "@components/auth/SignUpForm";
import { createClient } from "@utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getUser();

	if (!error && data?.user) {
		redirect("/");
	}

	return (
		<main className={styles["signup-holder"]}>
			<SignUpForm />
		</main>
	);
}
