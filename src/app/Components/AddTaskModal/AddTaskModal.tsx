"use client";

import styles from "./AddTaskModal.module.scss";

import {
	ensureNotificationPermission,
	getReminderPermissionError,
	type ReminderNotificationPermission,
} from "@/lib/pushSubscription";
import { createTaskReminder, deleteTaskReminder } from "@/lib/taskReminderClient";
import {
	detectTaskReminder,
	formatReminderDateTime,
	getTaskReminderKey,
	toDateInputValue,
} from "@/lib/taskReminderParser";
import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import { Message } from "@atoms/Message/Message";
import { Text } from "@atoms/Text/Text";
import type { GeneralTodo } from "@prisma/client";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "react-toastify";
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

function todayDateString() {
	return toDateInputValue(new Date());
}

function formatDateLabel(dateStr: string): string {
	const today = todayDateString();
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const tomorrowStr = toDateInputValue(tomorrow);

	if (dateStr === today) return "Today";
	if (dateStr === tomorrowStr) return "Tomorrow";
	return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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
	const seedText = isEditMode ? editMode.initialText : defaultValue ?? "";
	const initialReminder = detectTaskReminder(seedText);
	const [error, setError] = useState<string | undefined>(undefined);
	const [isPending, startTransition] = useTransition();
	const formRef = useRef<HTMLFormElement>(null);
	const dateInputRef = useRef<HTMLInputElement>(null);
	const timeInputRef = useRef<HTMLInputElement>(null);
	const [taskText, setTaskText] = useState(seedText);
	const [detectedReminder, setDetectedReminder] = useState(initialReminder);
	const [removedReminderSeed, setRemovedReminderSeed] = useState<{ message: string; scheduledAt: Date } | null>(null);
	const [dismissedReminderKey, setDismissedReminderKey] = useState<string | null>(null);

	const [reminderDate, setReminderDate] = useState(initialReminder?.dateValue ?? todayDateString());
	const [reminderTime, setReminderTime] = useState(initialReminder?.timeValue ?? "");
	const [showTimeInput, setShowTimeInput] = useState(Boolean(initialReminder?.timeValue));
	const [reminderMode, setReminderMode] = useState<"default" | "detected" | "manual">(
		initialReminder ? "detected" : "default",
	);

	const resetReminder = () => {
		setReminderDate(todayDateString());
		setReminderTime("");
		setShowTimeInput(false);
	};

	const initializeFormState = (text: string) => {
		const reminder = detectTaskReminder(text);
		setTaskText(text);
		setDetectedReminder(reminder);
		setError(undefined);
		setRemovedReminderSeed(null);
		setDismissedReminderKey(null);

		if (reminder) {
			setReminderDate(reminder.dateValue);
			setReminderTime(reminder.timeValue);
			setShowTimeInput(Boolean(reminder.timeValue));
			setReminderMode("detected");
			return;
		}

		resetReminder();
		setReminderMode("default");
	};

	useEffect(() => {
		initializeFormState(seedText);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [seedText]);

	useEffect(() => {
		if (open) return;
		initializeFormState(seedText);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, seedText]);

	useEffect(() => {
		if (showTimeInput && reminderMode === "manual") {
			timeInputRef.current?.focus();
		}
	}, [showTimeInput, reminderMode]);

	const activeReminder = detectedReminder && getTaskReminderKey(detectedReminder) !== dismissedReminderKey
		? detectedReminder
		: null;

	const handleTaskTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const nextText = event.target.value;
		const reminder = detectTaskReminder(nextText);
		const isDismissedReminder = reminder
			? getTaskReminderKey(reminder) === dismissedReminderKey
			: false;

		setTaskText(nextText);
		setDetectedReminder(reminder);

		if (reminder) {
			if (!isDismissedReminder && reminderMode !== "manual") {
				setReminderDate(reminder.dateValue);
				setReminderTime(reminder.timeValue);
				setShowTimeInput(Boolean(reminder.timeValue));
				setReminderMode("detected");
			}
			return;
		}

		setDismissedReminderKey(null);
		if (reminderMode === "detected") {
			resetReminder();
			setReminderMode("default");
		}
	};

	const handleDialogOpenChange = (nextOpen: boolean) => {
		onOpenAction(nextOpen);
	};

	const handleDismissReminder = () => {
		if (!activeReminder) return;

		if (initialReminder?.hasExplicitTime && seedText.trim()) {
			setRemovedReminderSeed({
				message: seedText.trim(),
				scheduledAt: initialReminder.scheduledAt,
			});
		}

		setDismissedReminderKey(getTaskReminderKey(activeReminder));
		resetReminder();
		setReminderMode("default");
	};

	const handleSaveClick = async () => {
		setError(undefined);

		const formData = new FormData(formRef.current!);
		const text = taskText.trim();

		if (!text) {
			setError("Task text is required");
			return;
		}

		formData.set("text", text);

		const reminderAt = reminderTime ? new Date(`${reminderDate}T${reminderTime}:00`) : null;
		const shouldCreateReminder = Boolean(reminderAt && reminderAt > new Date());
		let reminderPermission: ReminderNotificationPermission | null = null;

		if (shouldCreateReminder) {
			reminderPermission = await ensureNotificationPermission();
		}

		const tempId = `temp-${Date.now()}`;

		if (isEditMode) {
			onOptimisticUpdate?.(editMode.todoId, text);
		} else {
			onOptimisticAdd?.({
				id: tempId,
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

		onOpenAction(false);

		startTransition(async () => {
			const result = await saveGeneralTodo({ error: undefined }, formData);

			if (result.error) {
				setError(result.error);
				onOpenAction(true);
				return;
			}

			if (result.success && removedReminderSeed) {
				const deleted = await deleteTaskReminder(removedReminderSeed.message, removedReminderSeed.scheduledAt);
				if (!deleted) {
					toast.error("Task updated, but the previous reminder could not be removed");
				}
			}

			if (result.success && shouldCreateReminder && reminderAt) {
				if (reminderPermission !== "granted") {
					toast.error(getReminderPermissionError(reminderPermission ?? "denied"));
				} else {
					const reminderResult = await createTaskReminder(text, reminderAt);
					if (reminderResult.ok) {
						toast.success(
							`Reminder set for ${reminderAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
						);
					} else {
						toast.error("Task saved but reminder could not be set");
					}
				}
			}

			if (result.success) {
				initializeFormState(seedText);
			}

			onSuccess?.();
		});
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		void handleSaveClick();
	};

	const formKey = isEditMode ? editMode.todoId : "create";

	return (
		<Dialog.Root open={open} onOpenChange={handleDialogOpenChange}>
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
								? "Update your thought or assignment."
								: "Capture your thought or assignment quickly."}
						</Dialog.Description>
					</div>
					<form ref={formRef} key={formKey} onSubmit={handleFormSubmit} className={styles["form"]}>
						{isEditMode && <input type="hidden" name="todoId" value={editMode.todoId} />}

						<fieldset className={styles["fieldset"]}>
							<input
								className={styles["task-input"]}
								name="text"
								type="text"
								value={taskText}
								onChange={handleTaskTextChange}
								placeholder="Add a task..."
								required
								autoFocus
							/>
						</fieldset>

						<div className={styles["chips"]}>
							{activeReminder && (
								<span
									className={`${styles["chip"]} ${styles["chip--detected"]}`}
									data-ready={activeReminder.hasExplicitTime ? "true" : "false"}
									role="status"
								>
									<span className={styles["chip-label"]}>
										<Icon name="bell" />
										{activeReminder.hasExplicitTime
											? `Auto reminder ${formatReminderDateTime(activeReminder.scheduledAt)}`
											: `Detected ${activeReminder.matchedText}, add a time`}
									</span>
									<button
										type="button"
										className={styles["chip-dismiss"]}
										onClick={handleDismissReminder}
										aria-label="Remove reminder"
									>
										<Icon name="close" size={14} />
									</button>
								</span>
							)}
							{/* Hidden native date input triggered by the chip */}
							<input
								ref={dateInputRef}
								type="date"
								className={styles["hidden-date"]}
								value={reminderDate}
								min={todayDateString()}
								onChange={(e) => {
									setReminderDate(e.target.value);
									setReminderMode("manual");
								}}
							/>
							<button
								type="button"
								className={styles["chip"]}
								onClick={() => dateInputRef.current?.showPicker?.()}
							>
								<Icon name="calendar" />
								{formatDateLabel(reminderDate)}
							</button>

							{showTimeInput
								? (
									<input
										ref={timeInputRef}
										type="time"
										className={styles["time-input"]}
										value={reminderTime}
										onChange={(e) => {
											setReminderTime(e.target.value);
											setReminderMode("manual");
										}}
									/>
								)
								: (
									<button
										type="button"
										className={styles["chip"]}
										onClick={() => {
											setShowTimeInput(true);
											setReminderMode("manual");
										}}
									>
										<Icon name="bell" />
										Set Time
									</button>
								)}
						</div>

						{error && <Message variant="error">{error}</Message>}

						<div className={styles["button-group"]}>
							<Dialog.Close asChild>
								<Button
									type="button"
									variant="secondary"
									size="lg"
									className={styles["close-action"]}
									aria-label="Close"
								>
									Close
								</Button>
							</Dialog.Close>
							<Button
								type="button"
								variant="primary"
								size="lg"
								className={styles["save-action"]}
								disabled={isPending}
								onClick={() => {
									void handleSaveClick();
								}}
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
