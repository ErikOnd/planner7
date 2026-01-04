"use client";

import styles from "./AuthForm.module.scss";

import { Button } from "@atoms/Button/Button";
import { InputField } from "@atoms/InputField/InputField";
import { Message } from "@atoms/Message/Message";
import { Text } from "@atoms/Text/Text";
import { useAuthActions } from "@hooks/useAuthActions";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PasswordField } from "./PasswordField";

export function LoginForm() {
	const { loading, logIn, sendResetPassword, errorMsg, infoMsg } = useAuthActions();
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		await logIn(email, password);
	}

	return (
		<form onSubmit={onSubmit} className={styles.form}>
			<Text as="p" size="xl" fontWeight={700} className={styles.title}>
				Welcome back
			</Text>
			<Text as="p" size="sm" className={styles.subtitle}>
				Please sign in to continue to Planner7
			</Text>

			<div className={styles["input-group"]}>
				<div>
					<label htmlFor="email">
						<Text as="span" size="sm" fontWeight={600}>Email</Text>
					</label>
					<InputField
						id="email"
						type="email"
						value={email}
						placeholder="you@example.com"
						autoComplete="email"
						required
						disabled={loading}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</div>

				<PasswordField value={password} onChange={setPassword} disabled={loading} />
			</div>

			<div className={styles.footerRow}>
				<Button type="button" variant="secondary" onClick={() => sendResetPassword(email)} disabled={loading}>
					Forgot password?
				</Button>
			</div>
			<Message variant="error">{errorMsg}</Message>
			<Message variant="info">{infoMsg}</Message>
			<div className={styles.actionsRow}>
				<Button type="submit" variant="primary" disabled={loading} fontWeight={700}>
					{loading ? "Signing in..." : "Log in"}
				</Button>
				<Button type="button" variant="secondary" fontWeight={700} onClick={() => router.push("/signup")}>
					Sign up
				</Button>
			</div>
		</form>
	);
}
