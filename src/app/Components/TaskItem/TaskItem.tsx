import styles from "./TaskItem.module.scss";

import Checkbox from "@atoms/Checkbox/Checkbox";
import { Icon } from "@atoms/Icons/Icon";

type TaskItemProps = {
	taskName: string;
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	onEdit?: () => void;
	onDelete?: () => void;
};

export function TaskItem(props: TaskItemProps) {
	const { taskName, checked, onChange, onEdit, onDelete } = props;
	return (
		<div className={styles["task-item"]}>
			<Checkbox label={taskName} checked={checked} onChange={onChange} />
			<div className={styles["action-buttons"]}>
				{onEdit && (
					<button
						className={styles["edit-button"]}
						onClick={onEdit}
						aria-label="Edit task"
						type="button"
					>
						<Icon name="pencil" />
					</button>
				)}
				{onDelete && (
					<button
						className={styles["delete-button"]}
						onClick={onDelete}
						aria-label="Delete task"
						type="button"
					>
						<Icon name="trash" />
					</button>
				)}
			</div>
		</div>
	);
}
