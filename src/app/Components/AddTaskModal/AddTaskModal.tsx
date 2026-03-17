"use client";

import styles from "./AddTaskModal.module.scss";

import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import { Message } from "@atoms/Message/Message";
import { Text } from "@atoms/Text/Text";
import type { GeneralTodo } from "@prisma/client";
import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState, useTransition } from "react";
import { saveGeneralTodo } from "../../actions/generalTodos";

type AddTaskModalProps = {
	open: boolean;
	onOpenAction: (open: boolean) => void;
	defaultValue?: string;
	renderTrigger?: boolean;
	editMode?: {
		todoId: string;
		initialText: string;
	};
	onOptimisticAdd?: (todo: GeneralTodo) => void;
	onOptimisticUpdate?: (todoId: string, text: string) => void;
	onSuccess?: () => void;
};

export function AddTaskModal(props: AddTaskModalProps) {
	const {
		open,
		onOpenAction,
		defaultValue,
		renderTrigger = true,
		editMode,
		onOptimisticAdd,
		onOptimisticUpdate,
		onSuccess,
	} = props;
	const isEditMode = !!editMode;
	const [error, setError] = useState<string | undefined>(undefined);
	const [isPending, startTransition] = useTransition();
	const formRef = useRef<HTMLFormElement>(null);

	const handleSaveClick = () => {
		setError(undefined);

		const formData = new FormData(formRef.current!);
		const text = formData.get("text") as string;

		if (!text || text.trim().length === 0) {
			setError("Task text is required");
			return;
		}

		const tempId = `temp-${Date.now()}`;

		if (isEditMode) {
			if (onOptimisticUpdate) {
				onOptimisticUpdate(editMode.todoId, text.trim());
			}
		} else {
			if (onOptimisticAdd) {
				const tempTodo = {
					id: tempId,
					userId: "",
					workspaceId: "",
					text: text.trim(),
					order: 0,
					completed: false,
					completedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				} as GeneralTodo;
				onOptimisticAdd(tempTodo);
			}
		}

		onOpenAction(false);
		formRef.current?.reset();

		startTransition(async () => {
			const result = await saveGeneralTodo({ error: undefined }, formData);

			if (result.error) {
				setError(result.error);
				onOpenAction(true);
			} else if (result.success) {
				if (onSuccess) {
					onSuccess();
				}
			}
		});
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSaveClick();
	};

	const formKey = isEditMode ? editMode.todoId : "create";

	return (
		<Dialog.Root open={open} onOpenChange={onOpenAction}>
			{renderTrigger && (
				<Dialog.Trigger asChild>
					<button className={styles["add-task-button"]}>
						<Icon name="plus" />
					</button>
				</Dialog.Trigger>
			)}
			<Dialog.Portal>
				<Dialog.Overlay className={styles["overlay"]} />
				<Dialog.Content className={styles["content"]}>
					<div className={styles["sheet-handle"]} aria-hidden="true" />
					<div className={styles["header"]}>
						<Dialog.Title className={styles["title"]}>
							<Text fontWeight={700}>{isEditMode ? "Edit Task" : "New Task"}</Text>
						</Dialog.Title>
						<Dialog.Description className={styles["description"]}>
							{isEditMode
								? "Update your thought or assignment quickly."
								: "Capture your thought or assignment quickly."}
						</Dialog.Description>
					</div>
					<form ref={formRef} key={formKey} onSubmit={handleFormSubmit} className={styles["form"]}>
						{isEditMode && <input type="hidden" name="todoId" value={editMode.todoId} />}
						<fieldset className={styles["fieldset"]}>
							<textarea
								className={styles["task-input"]}
								name="text"
								defaultValue={isEditMode ? editMode.initialText : defaultValue}
								placeholder="Add a new task"
								required
								rows={6}
							/>
						</fieldset>
						{error && <Message variant="error">{error}</Message>}
						<div className={styles["button-group"]}>
							<Dialog.Close asChild>
								<Button type="button" variant="ghost" size="lg" className={styles["close-action"]} aria-label="Close">
									Close
								</Button>
							</Dialog.Close>
							<Button
								type="button"
								variant="primary"
								size="lg"
								className={styles["save-action"]}
								disabled={isPending}
								onClick={handleSaveClick}
							>
								Save Task
							</Button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
