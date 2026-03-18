"use client";

import { Button } from "@atoms/Button/Button";
import { Message } from "@atoms/Message/Message";
import type { GeneralTodo } from "@prisma/client";
import { useRef, useState, useTransition } from "react";
import { saveGeneralTodo } from "../../actions/generalTodos";
import styles from "./MobileAddTaskPage.module.scss";

type MobileAddTaskPageProps = {
	onDone: () => void;
	onOptimisticAdd?: (todo: GeneralTodo) => void;
	onOptimisticUpdate?: (todoId: string, text: string) => void;
	onSuccess?: () => void;
	editMode?: {
		todoId: string;
		initialText: string;
	};
};

export function MobileAddTaskPage({
	onDone,
	onOptimisticAdd,
	onOptimisticUpdate,
	onSuccess,
	editMode,
}: MobileAddTaskPageProps) {
	const isEdit = !!editMode;
	const [error, setError] = useState<string | undefined>();
	const [, startTransition] = useTransition();
	const formRef = useRef<HTMLFormElement>(null);

	const handleSave = () => {
		setError(undefined);
		const formData = new FormData(formRef.current!);
		const text = (formData.get("text") as string)?.trim();

		if (!text) {
			setError("Task text is required");
			return;
		}

		if (isEdit) {
			onOptimisticUpdate?.(editMode.todoId, text);
		} else {
			onOptimisticAdd?.({
				id: `temp-${Date.now()}`,
				userId: "",
				workspaceId: "",
				text,
				order: 0,
				completed: false,
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			} as GeneralTodo);
		}

		onDone();

		startTransition(async () => {
			const result = await saveGeneralTodo({ error: undefined }, formData);
			if (result.success) {
				onSuccess?.();
			}
		});
	};

	return (
		<div className={styles["page"]}>
			<div className={styles["header"]}>
				<h2 className={styles["title"]}>{isEdit ? "Edit Task" : "New Task"}</h2>
				<p className={styles["description"]}>
					{isEdit ? "Update your thought or assignment." : "Capture your thought or assignment quickly."}
				</p>
			</div>
			<form
				ref={formRef}
				key={isEdit ? editMode.todoId : "create"}
				onSubmit={(e) => {
					e.preventDefault();
					handleSave();
				}}
				className={styles["form"]}
			>
				{isEdit && <input type="hidden" name="todoId" value={editMode.todoId} />}
				<textarea
					className={styles["textarea"]}
					name="text"
					defaultValue={isEdit ? editMode.initialText : undefined}
					placeholder="Add a new task"
					rows={5}
					// biome-ignore lint/a11y/noAutofocus: intentional for mobile page UX
					autoFocus
				/>
				{error && <Message variant="error">{error}</Message>}
				<div className={styles["actions"]}>
					<Button
						type="button"
						variant="primary"
						size="lg"
						onClick={handleSave}
						className={styles["save-btn"]}
					>
						Save Task
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="lg"
						onClick={onDone}
						className={styles["cancel-btn"]}
					>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	);
}
