import profilePlaceholder from "@assets/images/profile-image-placeholder.jpg";
import Checkbox from "@atoms/Checkbox/Checkbox";
import { Icon } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";
import WeeklySlider from "@components/WeeklySlider/WeeklySlider";
import { isCurrentWeek } from "@utils/usCurrentWeek";
import Image from "next/image";
import styles from "./Sidebar.module.scss";

type SidebarProps = {
	baseDate: Date;
	setBaseDate: (date: Date) => void;
	rangeLabel: string;
};

export function Sidebar(props: SidebarProps) {
	const { baseDate, setBaseDate, rangeLabel } = props;
	const generalTodos = [
		"Check emails from team Check emails from team Check emails from team Check emails from team Check emails from team Check emails from team",
		"Order new supplies",
		"Follow up with clients",
		"Check emails from team Check emails from team Check emails from team Check emails from team Check emails from team Check emails from team",
		"Order new supplies",
		"Follow up with clients",
		"Check emails from team Check emails from team Check emails from team Check emails from team Check emails from team Check emails from team",
		"Order new supplies",
		"Follow up with clients",
	];
	return (
		<div className={styles["sidebar"]}>
			<div className={styles["profile-section"]}>
				<button type="button" aria-label="Open profile" className={styles["profile-button"]}>
					<Image alt="profile image" src={profilePlaceholder} className={styles["profile-image"]} />
				</button>
				<div className={styles["profile-info"]}>
					<Text className={styles["username"]}>John Doe</Text>
					<Text size="sm" className={styles["email"]}>john.doe@example.com</Text>
				</div>
			</div>
			<div className={styles["week-slider-section"]}>
				<WeeklySlider baseDate={baseDate} rangeLabel={rangeLabel} setBaseDate={setBaseDate} />
				{isCurrentWeek(baseDate) && (
					<div className={styles["current-week-indicator"]}>
						<Text>Current Week</Text>
					</div>
				)}
			</div>
			<div className={styles["remember-section"]}>
				<Text size="xl" className={styles["remember-header"]}>
					General Todos
				</Text>
				<div className={styles["remember-items"]}>
					{generalTodos.map((label, idx) => (
						<Checkbox key={idx} label={label} />
					))}
				</div>
				<button type="button" className={styles["add-item"]}>
					<Icon name="plus" />
					<Text>Add new Item</Text>
				</button>
			</div>
			<div className={styles["settings-section"]}>
				<button type="button" className={styles["settings-item"]}>
					<Icon name="settings" />
					<Text className={styles["settings-label"]}>Settings</Text>
				</button>
				<button type="button" className={styles["settings-item"]}>
					<Icon name="questionmark" />
					<Text className={styles["settings-label"]}>Help & Support</Text>
				</button>
				<button type="button" className={styles["settings-item"]}>
					<Icon name="sign-out" />
					<Text className={styles["settings-label"]}>Sign Out</Text>
				</button>
			</div>
		</div>
	);
}
