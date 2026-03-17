import styles from "./TaskItem.module.scss";

import Checkbox from "@atoms/Checkbox/Checkbox";
import { Icon } from "@atoms/Icons/Icon";

type TaskItemProps = {
	taskName: string;
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	onEdit?: () => void;
};

export function TaskItem(props: TaskItemProps) {
	const { taskName, checked, onChange, onEdit } = props;
	return (
		<div className={styles["task-item"]} data-checked={checked ? "true" : "false"}>
			<Checkbox
				label={taskName}
				checked={checked}
				onChange={onChange}
				className={styles["task-checkbox"]}
				checkmarkClassName={styles["task-checkmark"]}
				labelClassName={styles["task-label"]}
			/>
			{onEdit && (
				<div className={styles["action-buttons"]}>
					<button
						className={styles["edit-button"]}
						onClick={onEdit}
						onPointerDown={(event) => event.stopPropagation()}
						aria-label="Edit task"
						type="button"
					>
						<Icon name="pencil" size={18} />
					</button>
				</div>
			)}
		</div>
	);
}
