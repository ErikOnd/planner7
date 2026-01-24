"use client";

import { Badge } from "@atoms/Badge/Badge";
import { Text } from "@atoms/Text/Text";

type ConnectorsSettingsProps = {
	styles: Record<string, string>;
};

export function ConnectorsSettings({ styles }: ConnectorsSettingsProps) {
	return (
		<div className={styles["tab-content"]}>
			<section className={styles["settings-section"]}>
				<div className={styles["section-header"]}>
					<h3 className={styles["section-heading"]}>Third-party Integrations</h3>
					<Badge variant="coming-soon">Coming soon</Badge>
				</div>
				<Text size="sm" variant="muted">Connect planner7 with other services</Text>
			</section>
		</div>
	);
}
