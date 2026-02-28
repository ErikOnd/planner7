import styles from "./loading.module.scss";

import { Spinner } from "@atoms/Spinner/Spinner";

export default function Loading() {
	return (
		<main className={styles["loading-page"]}>
			<Spinner />
		</main>
	);
}
