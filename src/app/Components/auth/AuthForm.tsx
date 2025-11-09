"use client";

import styles from "./AuthForm.module.scss";

import { Button } from "@atoms/Button/Button";
import { InputField } from "@atoms/InputField/InputField";
import { Message } from "@atoms/Message/Message";
import { Text } from "@atoms/Text/Text";
import { useAuthActions } from "@hooks/useAuthActions";
import { FormEvent, useState } from "react";
import { PasswordField } from "./PasswordField";

export function AuthForm() {
	const { loading, logIn, signUp, sendResetPassword, errorMsg, infoMsg } = useAuthActions();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		await logIn(email, password);
	}

	return (
		<form onSubmit={onSubmit} className={styles.form}>
			<Text as="div" size="xl" fontWeight={700} className={styles.title}>
				Welcome back
			</Text>
			<Text as="p" size="sm" className={styles.subtitle}>
				Please sign in to continue to Weekly Planner
			</Text>

			<label htmlFor="email">
				<Text as="span" size="sm" fontWeight={600}>Email</Text>
			</label>
			<div className={styles["input-group"]}>
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
				<Button
					type="button"
					variant="secondary"
					onClick={() => signUp(email, password)}
					disabled={loading}
					fontWeight={700}
				>
					{loading ? "Please wait..." : "Sign up"}
				</Button>
			</div>
		</form>
	);
}
