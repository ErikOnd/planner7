import { Button } from "@atoms/Button/Button";
import { Text } from "@atoms/Text/Text";
import styles from "./AuthCodeError.module.scss";

export default function AuthCodeError() {
	return (
		<div className={styles["auth-code-error"]}>
			<Text size="xl">Authentication Error</Text>
			<Text>
				There was an error verifying your email. The link may have expired or already been used.
			</Text>
			<Button href="/login" variant="primary">Back to Login</Button>
		</div>
	);
}
