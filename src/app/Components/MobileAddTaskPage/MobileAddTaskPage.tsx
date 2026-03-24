"use client";

import {
	ensureNotificationPermission,
	getReminderPermissionError,
	type ReminderNotificationPermission,
} from "@/lib/pushSubscription";
import { createTaskReminder, deleteTaskReminder } from "@/lib/taskReminderClient";
import { detectTaskReminder, formatReminderDateTime, getTaskReminderKey } from "@/lib/taskReminderParser";
import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import { Message } from "@atoms/Message/Message";
import type { GeneralTodo } from "@prisma/client";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "react-toastify";
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
	const seedText = isEdit ? editMode.initialText : "";
	const initialReminder = detectTaskReminder(seedText);
	const [error, setError] = useState<string | undefined>();
	const [, startTransition] = useTransition();
	const formRef = useRef<HTMLFormElement>(null);
	const [taskText, setTaskText] = useState(seedText);
	const [detectedReminder, setDetectedReminder] = useState(initialReminder);
	const [removedReminderSeed, setRemovedReminderSeed] = useState<{ message: string; scheduledAt: Date } | null>(null);
	const [dismissedReminderKey, setDismissedReminderKey] = useState<string | null>(null);

	useEffect(() => {
		setTaskText(seedText);
		setDetectedReminder(detectTaskReminder(seedText));
		setError(undefined);
		setRemovedReminderSeed(null);
		setDismissedReminderKey(null);
	}, [seedText]);

	const activeReminder = detectedReminder && getTaskReminderKey(detectedReminder) !== dismissedReminderKey
		? detectedReminder
		: null;

	const handleDismissReminder = () => {
		if (!activeReminder) return;

		if (initialReminder?.hasExplicitTime && seedText.trim()) {
			setRemovedReminderSeed({
				message: seedText.trim(),
				scheduledAt: initialReminder.scheduledAt,
			});
		}

		setDismissedReminderKey(getTaskReminderKey(activeReminder));
	};

	const handleSave = async () => {
		setError(undefined);
		const formData = new FormData(formRef.current!);
		const text = taskText.trim();

		if (!text) {
			setError("Task text is required");
			return;
		}

		formData.set("text", text);
		const reminderAt = activeReminder?.hasExplicitTime ? activeReminder.scheduledAt : null;
		const shouldCreateReminder = Boolean(reminderAt && reminderAt > new Date());
		let reminderPermission: ReminderNotificationPermission | null = null;

		if (shouldCreateReminder) {
			reminderPermission = await ensureNotificationPermission();
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
				if (removedReminderSeed) {
					const deleted = await deleteTaskReminder(removedReminderSeed.message, removedReminderSeed.scheduledAt);
					if (!deleted) {
						toast.error("Task updated, but the previous reminder could not be removed");
					}
				}
				if (shouldCreateReminder && reminderAt) {
					if (reminderPermission !== "granted") {
						toast.error(getReminderPermissionError(reminderPermission ?? "denied"));
					} else {
						const reminderResult = await createTaskReminder(text, reminderAt);
						if (reminderResult.ok) {
							toast.success(
								`Reminder set for ${
									reminderAt.toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})
								}`,
							);
						} else {
							toast.error("Task saved but reminder could not be set");
						}
					}
				}
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
					void handleSave();
				}}
				className={styles["form"]}
			>
				{isEdit && <input type="hidden" name="todoId" value={editMode.todoId} />}
				<textarea
					className={styles["textarea"]}
					name="text"
					value={taskText}
					onChange={(event) => {
						const nextText = event.target.value;
						const nextReminder = detectTaskReminder(nextText);
						setTaskText(nextText);
						setDetectedReminder(nextReminder);
						if (!nextReminder) {
							setDismissedReminderKey(null);
						}
					}}
					placeholder="Add a new task"
					rows={5}
					// biome-ignore lint/a11y/noAutofocus: intentional for mobile page UX
					autoFocus
				/>
				{activeReminder && (
					<div className={styles["detected-reminder"]} role="status">
						<span className={styles["detected-reminder-label"]}>
							<Icon name="bell" />
							{activeReminder.hasExplicitTime
								? `Auto reminder ${formatReminderDateTime(activeReminder.scheduledAt)}`
								: `Detected ${activeReminder.matchedText}, add a time in the task text`}
						</span>
						<button
							type="button"
							className={styles["detected-reminder-dismiss"]}
							onClick={handleDismissReminder}
							aria-label="Remove reminder"
						>
							<Icon name="close" size={14} />
						</button>
					</div>
				)}
				{error && <Message variant="error">{error}</Message>}
				<div className={styles["actions"]}>
					<Button
						type="button"
						variant="primary"
						size="lg"
						onClick={() => {
							void handleSave();
						}}
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
