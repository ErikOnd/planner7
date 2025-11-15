import { Button } from "@atoms/Button/Button";
import { Text } from "@atoms/Text/Text";
import Link from "next/link";
import styles from "./AuthCodeError.module.scss";

export default function AuthCodeError() {
	return (
		<div className={styles["auth-code-error"]}>
			<Text size="xl">Authentication Error</Text>
			<Text>
				There was an error verifying your email. The link may have expired or already been used.
			</Text>
			<Link href="/login">
				<Button variant="primary">Back to Login</Button>
			</Link>
		</div>
	);
}
