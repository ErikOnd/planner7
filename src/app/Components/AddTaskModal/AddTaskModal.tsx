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
import {
	formatDateTimeChipLabel,
	formatTimePart,
	formatTimeValue,
	getSuggestedReminderTime,
	parseTimeInput,
	parseTimeValue,
	type ReminderPickerStep,
	type ReminderSeed,
	todayDateString,
} from "@/lib/taskReminderPicker";
import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import { Message } from "@atoms/Message/Message";
import { Text } from "@atoms/Text/Text";
import { ReminderPickerOverlay } from "@components/ReminderPicker/ReminderPicker";
import type { GeneralTodo } from "@prisma/client";
import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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
	const [taskText, setTaskText] = useState(seedText);
	const [detectedReminder, setDetectedReminder] = useState(initialReminder);
	const [removedReminderSeed, setRemovedReminderSeed] = useState<ReminderSeed | null>(null);
	const [dismissedReminderKey, setDismissedReminderKey] = useState<string | null>(null);

	const [reminderDate, setReminderDate] = useState(initialReminder?.dateValue ?? todayDateString());
	const [reminderTime, setReminderTime] = useState(initialReminder?.timeValue ?? "");
	const [reminderMode, setReminderMode] = useState<"default" | "detected" | "manual">(
		initialReminder ? "detected" : "default",
	);
	const initialPickerTime = parseTimeValue(
		getSuggestedReminderTime(initialReminder?.dateValue ?? todayDateString(), initialReminder?.timeValue),
	);
	const initialReminderSeed: ReminderSeed | null = initialReminder?.hasExplicitTime && seedText.trim()
		? {
			message: seedText.trim(),
			scheduledAt: initialReminder.scheduledAt,
		}
		: null;
	const [pickerStep, setPickerStep] = useState<ReminderPickerStep | null>(null);
	const [pickerHour, setPickerHour] = useState(formatTimePart(initialPickerTime.hour));
	const [pickerMinute, setPickerMinute] = useState(formatTimePart(initialPickerTime.minute));

	const closePicker = useCallback(() => {
		setPickerStep(null);
	}, [setPickerStep]);

	const syncPickerTime = useCallback((dateValue: string, timeValue: string) => {
		const nextPickerTime = parseTimeValue(getSuggestedReminderTime(dateValue, timeValue));
		setPickerHour(formatTimePart(nextPickerTime.hour));
		setPickerMinute(formatTimePart(nextPickerTime.minute));
	}, [setPickerHour, setPickerMinute]);

	const resetReminder = useCallback(() => {
		const nextDate = todayDateString();
		setReminderDate(nextDate);
		setReminderTime("");
		syncPickerTime(nextDate, "");
	}, [setReminderDate, setReminderTime, syncPickerTime]);

	const initializeFormState = useCallback((text: string) => {
		const reminder = detectTaskReminder(text);
		setTaskText(text);
		setDetectedReminder(reminder);
		setError(undefined);
		setRemovedReminderSeed(null);
		setDismissedReminderKey(null);
		closePicker();

		if (reminder) {
			setReminderDate(reminder.dateValue);
			setReminderTime(reminder.timeValue);
			syncPickerTime(reminder.dateValue, reminder.timeValue);
			setReminderMode("detected");
			return;
		}

		resetReminder();
		setReminderMode("default");
	}, [
		closePicker,
		resetReminder,
		setDetectedReminder,
		setDismissedReminderKey,
		setError,
		setReminderDate,
		setReminderMode,
		setReminderTime,
		setRemovedReminderSeed,
		setTaskText,
		syncPickerTime,
	]);

	useEffect(() => {
		initializeFormState(seedText);
	}, [initializeFormState, seedText]);

	useEffect(() => {
		if (open) return;
		initializeFormState(seedText);
	}, [initializeFormState, open, seedText]);

	const activeReminder = detectedReminder && getTaskReminderKey(detectedReminder) !== dismissedReminderKey
		? detectedReminder
		: null;
	const shouldShowManualReminderClear = reminderMode === "manual" && Boolean(reminderTime) && !activeReminder;
	const resolvePickerHour = () => parseTimeInput(pickerHour, 9, 23);
	const resolvePickerMinute = () => parseTimeInput(pickerMinute, 30, 59);
	const queueInitialReminderRemoval = () => {
		if (initialReminderSeed) {
			setRemovedReminderSeed(initialReminderSeed);
		}
	};
	const resetToDefaultReminder = () => {
		closePicker();
		resetReminder();
		setReminderMode("default");
	};

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
				syncPickerTime(reminder.dateValue, reminder.timeValue);
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
		if (!nextOpen) {
			closePicker();
		}
		onOpenAction(nextOpen);
	};

	const handleDismissReminder = () => {
		if (!activeReminder) return;

		queueInitialReminderRemoval();
		setDismissedReminderKey(getTaskReminderKey(activeReminder));
		resetToDefaultReminder();
	};

	const handleClearManualReminder = () => {
		queueInitialReminderRemoval();
		resetToDefaultReminder();
	};

	const openReminderPicker = () => {
		syncPickerTime(reminderDate, reminderTime);
		setPickerStep("calendar");
	};

	const handleCalendarDateSelect = (date: Date) => {
		const nextDate = toDateInputValue(date);
		setReminderDate(nextDate);
		setReminderMode("manual");
		syncPickerTime(nextDate, reminderTime);
		setPickerStep("time");
	};

	const handlePickerHourBlur = () => {
		setPickerHour(formatTimePart(resolvePickerHour()));
	};

	const handlePickerMinuteBlur = () => {
		setPickerMinute(formatTimePart(resolvePickerMinute()));
	};

	const adjustPickerHour = (delta: number) => {
		setPickerHour((current) => {
			const nextHour = (parseTimeInput(current, 9, 23) + delta + 24) % 24;
			return formatTimePart(nextHour);
		});
	};

	const adjustPickerMinute = (delta: number) => {
		setPickerMinute((currentMinute) => {
			const parsedMinute = parseTimeInput(currentMinute, 30, 59);
			const nextMinute = parsedMinute + delta;

			if (nextMinute >= 60) {
				setPickerHour((currentHour) => {
					const nextHour = (parseTimeInput(currentHour, 9, 23) + 1) % 24;
					return formatTimePart(nextHour);
				});
				return formatTimePart(nextMinute - 60);
			}

			if (nextMinute < 0) {
				setPickerHour((currentHour) => {
					const nextHour = (parseTimeInput(currentHour, 9, 23) + 23) % 24;
					return formatTimePart(nextHour);
				});
				return formatTimePart(nextMinute + 60);
			}

			return formatTimePart(nextMinute);
		});
	};

	const handleConfirmPickerTime = () => {
		const resolvedHour = resolvePickerHour();
		const resolvedMinute = resolvePickerMinute();
		const nextTimeValue = formatTimeValue(resolvedHour, resolvedMinute);

		setPickerHour(formatTimePart(resolvedHour));
		setPickerMinute(formatTimePart(resolvedMinute));
		setReminderTime(nextTimeValue);
		setReminderMode("manual");
		closePicker();
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
		const reminderToRemove = removedReminderSeed
			?? (
				initialReminderSeed
					&& (
						text !== initialReminderSeed.message
						|| !reminderAt
						|| reminderAt.getTime() !== initialReminderSeed.scheduledAt.getTime()
					)
					? initialReminderSeed
					: null
			);
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

		closePicker();
		onOpenAction(false);

		startTransition(async () => {
			const result = await saveGeneralTodo({ error: undefined }, formData);

			if (result.error) {
				setError(result.error);
				onOpenAction(true);
				return;
			}

			if (result.success && reminderToRemove) {
				const deleted = await deleteTaskReminder(reminderToRemove.message, reminderToRemove.scheduledAt);
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
				<Dialog.Content
					className={styles["content"]}
					onEscapeKeyDown={(event) => {
						if (pickerStep) {
							event.preventDefault();
							closePicker();
						}
					}}
				>
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
							<button
								type="button"
								className={styles["chip"]}
								onClick={openReminderPicker}
							>
								<Icon name={reminderTime ? "bell" : "calendar"} />
								{formatDateTimeChipLabel(reminderDate, reminderTime)}
							</button>
							{shouldShowManualReminderClear && (
								<button
									type="button"
									className={`${styles["chip"]} ${styles["chip--icon"]}`}
									onClick={handleClearManualReminder}
									aria-label="Clear reminder"
								>
									<Icon name="close" size={14} />
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
					<ReminderPickerOverlay
						step={pickerStep}
						reminderDate={reminderDate}
						pickerHour={pickerHour}
						pickerMinute={pickerMinute}
						onClose={closePicker}
						onDateSelect={handleCalendarDateSelect}
						onBackToCalendar={() => setPickerStep("calendar")}
						onConfirm={handleConfirmPickerTime}
						onHourChange={setPickerHour}
						onHourBlur={handlePickerHourBlur}
						onHourStep={adjustPickerHour}
						onMinuteChange={setPickerMinute}
						onMinuteBlur={handlePickerMinuteBlur}
						onMinuteStep={adjustPickerMinute}
						styles={styles}
					/>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
