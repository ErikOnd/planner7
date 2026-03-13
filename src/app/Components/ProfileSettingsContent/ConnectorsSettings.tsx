"use client";

import { Badge } from "@atoms/Badge/Badge";
import { Icon } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";

type ConnectorsSettingsProps = {
	styles: Record<string, string>;
};

export function ConnectorsSettings({ styles }: ConnectorsSettingsProps) {
	const sectionIconSize = 24;

	return (
		<div className={styles["tab-content"]}>
			<section className={styles["settings-section"]}>
				<div className={styles["section-header"]}>
					<div className={styles["section-title-group"]}>
						<span className={styles["section-icon"]}>
							<Icon name="connectors" size={sectionIconSize} className={styles["section-icon-glyph"]} />
						</span>
						<div className={styles["section-title-stack"]}>
							<h3 className={styles["section-heading"]}>Connectors</h3>
							<p className={styles["section-description"]}>Third-party integrations will appear here as they ship.</p>
						</div>
					</div>
					<Badge variant="coming-soon">Coming soon</Badge>
				</div>
				<div className={styles["section-content"]}>
					<Text size="sm" variant="muted">Connect planner7 with other services once integrations are available.</Text>
				</div>
			</section>
		</div>
	);
}
