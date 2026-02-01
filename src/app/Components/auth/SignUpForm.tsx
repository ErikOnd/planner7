"use client";

import styles from "./AuthForm.module.scss";

import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import { InputField } from "@atoms/InputField/InputField";
import { Message } from "@atoms/Message/Message";
import { Text } from "@atoms/Text/Text";
import { useAuthActions } from "@hooks/useAuthActions";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PasswordField } from "./PasswordField";

export function SignUpForm() {
	const { loading, signUp, signInWithGoogle, errorMsg, infoMsg } = useAuthActions();
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [displayName, setDisplayName] = useState("");

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		await signUp(email, password, displayName);
	}

	return (
		<form onSubmit={onSubmit} className={styles.form}>
			<Text as="p" size="xl" fontWeight={700} className={styles.title}>
				Create an account
			</Text>
			<Text as="p" size="sm" className={styles.subtitle}>
				Sign up to start planning your week
			</Text>

			<div className={styles["input-group"]}>
				<div>
					<label htmlFor="displayName">
						<Text as="span" size="sm" fontWeight={600}>Name</Text>
					</label>
					<InputField
						id="displayName"
						type="text"
						value={displayName}
						placeholder="Your name or nickname"
						autoComplete="name"
						required
						disabled={loading}
						onChange={(e) => setDisplayName(e.target.value)}
					/>
				</div>

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

			<Message variant="error">{errorMsg}</Message>
			<Message variant="info">{infoMsg}</Message>
			<div className={styles.actionsRow}>
				<Button type="submit" variant="primary" disabled={loading} fontWeight={700}>
					{loading ? "Creating account..." : "Sign up"}
				</Button>
				<Button type="button" variant="secondary" fontWeight={700} onClick={() => router.push("/login")}>
					Already have an account? Log in
				</Button>
			</div>
			<div className={styles.divider}>
				<span>or</span>
			</div>
			<div className={styles.socialAuth}>
				<Button type="button" variant="secondary" disabled={loading} onClick={signInWithGoogle} wrapText={false} className={styles.googleButton}>
					<div className={styles.googleButtonContent}>
						<Icon name="google" size={20} />
						<Text size="sm" fontWeight={600}>Continue with Google</Text>
					</div>
				</Button>
			</div>
		</form>
	);
}
