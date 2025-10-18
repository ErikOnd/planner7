import Checkbox from "@atoms/Checkbox/Checkbox";
import styles from "./TaskItem.module.scss";

type TaskItemProps = {
	taskName: string;
};

export function TaskItem(props: TaskItemProps) {
	const { taskName } = props;
	return (
		<div className={styles["task-item"]}>
			<Checkbox label={taskName} />
		</div>
	);
}
