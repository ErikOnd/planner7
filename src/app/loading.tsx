import { Spinner } from "@atoms/Spinner/Spinner";

export default function Loading() {
	return (
		<main style={{ minHeight: "100dvh", display: "flex", justifyContent: "center", paddingTop: "8rem" }}>
			<Spinner />
		</main>
	);
}
