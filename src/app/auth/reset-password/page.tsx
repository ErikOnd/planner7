"use client";

import styles from "./ResetPassword.module.scss";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@atoms/Button/Button";
import { Message } from "@atoms/Message/Message";
import { Text } from "@atoms/Text/Text";
import { PasswordField } from "@components/auth/PasswordField";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function ResetPasswordPage() {
	const router = useRouter();
	const auth = useAuth();

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setErrorMsg(null);
		setSuccessMsg(null);

		if (password !== confirmPassword) {
			setErrorMsg("Passwords do not match");
			return;
		}

		if (password.length < 6) {
			setErrorMsg("Password must be at least 6 characters");
			return;
		}

		setLoading(true);

		try {
			const result = await auth.updatePassword(password);
			if (!result.success) {
				setErrorMsg(result.error || "Failed to update password");
			} else {
				setSuccessMsg("Password updated successfully! Redirecting...");
				setTimeout(() => {
					router.push("/app");
				}, 2000);
			}
		} catch {
			setErrorMsg("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className={styles.container}>
			<form onSubmit={onSubmit} className={styles.form}>
				<Text as="p" size="xl" fontWeight={700} className={styles.title}>
					Reset Your Password
				</Text>
				<Text as="p" size="sm" className={styles.subtitle}>
					Enter your new password below
				</Text>

				<div className={styles["input-group"]}>
					<label htmlFor="password">
						<Text as="span" size="sm" fontWeight={600}>
							New Password
						</Text>
					</label>
					<PasswordField
						id="password"
						value={password}
						onChange={setPassword}
						disabled={loading}
						placeholder="Enter new password"
					/>

					<label htmlFor="confirm-password">
						<Text as="span" size="sm" fontWeight={600}>
							Confirm Password
						</Text>
					</label>
					<PasswordField
						id="confirm-password"
						value={confirmPassword}
						onChange={setConfirmPassword}
						disabled={loading}
						placeholder="Confirm new password"
					/>
				</div>

				<Message variant="error">{errorMsg}</Message>
				<Message variant="info">{successMsg}</Message>

				<Button type="submit" variant="primary" disabled={loading} fontWeight={700}>
					{loading ? "Updating..." : "Update Password"}
				</Button>
			</form>
		</main>
	);
}
