"use client";

import styles from "./AuthForm.module.scss";

import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import { InputField } from "@atoms/InputField/InputField";
import { Message } from "@atoms/Message/Message";
import { Text } from "@atoms/Text/Text";
import { useAuthActions } from "@hooks/useAuthActions";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { PasswordField } from "./PasswordField";

export function LoginForm() {
	const { loading, logIn, sendResetPassword, signInWithGoogle, errorMsg, infoMsg } = useAuthActions();

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
				<Button href="/signup" variant="secondary" fontWeight={700}>
					Sign up
				</Button>
			</div>
			<div className={styles.divider}>
				<span>or</span>
			</div>
			<div className={styles.socialAuth}>
				<Button
					type="button"
					variant="secondary"
					disabled={loading}
					onClick={signInWithGoogle}
					wrapText={false}
					className={styles.googleButton}
				>
					<div className={styles.googleButtonContent}>
						<Icon name="google" size={20} />
						<Text size="sm" fontWeight={600}>Continue with Google</Text>
					</div>
				</Button>
			</div>
			<Text size="xs" className={styles["legal-note"]}>
				By continuing, you agree to our <Link href="/terms" className={styles["legal-link"]}>Terms of Service</Link> and
				{" "}
				<Link href="/privacy" className={styles["legal-link"]}>Privacy Policy</Link>.
			</Text>
		</form>
	);
}
