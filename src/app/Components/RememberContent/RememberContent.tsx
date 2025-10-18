import { AddTaskModal } from "@components/AddTaskModal/AddTaskModal";
import { TaskItem } from "@components/TaskItem/TaskItem";
import { useState } from "react";
import styles from "./RememberContent.module.scss";

type RememberContentProps = {
	rememberItems?: string[];
};

export function RememberContent(props: RememberContentProps) {
	const {} = props;

	const [modalOpen, setModalOpen] = useState(false);

	return (
		<div className={styles["remember-content"]}>
			<div className={styles["task-items"]}>
				<TaskItem taskName="Pay electric bill"  />
				<TaskItem
					taskName="Call mom for birthday wishes Call mom for birthday wishes Call mom for birthday wishes Call mom for birthday wishes Call mom for birthday wishes"
				/>
				<TaskItem taskName="Submit project proposal"  />
				<TaskItem taskName="Book dental appointment"  />
				<TaskItem taskName="Weekly team meeting"  />
				<TaskItem taskName="Review contract documents"  />
			</div>
			<AddTaskModal open={modalOpen} setOpen={setModalOpen} />
		</div>
	);
}
