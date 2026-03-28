"use client";

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
import { ReminderPickerOverlay } from "@components/ReminderPicker/ReminderPicker";
import type { GeneralTodo } from "@prisma/client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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

	const handleTaskTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
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

	const handleSave = async () => {
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

		closePicker();
		onDone();

		startTransition(async () => {
			const result = await saveGeneralTodo({ error: undefined }, formData);
			if (result.error) {
				toast.error(result.error);
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

			if (result.success) {
				initializeFormState(seedText);
			}

			onSuccess?.();
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
					onChange={handleTaskTextChange}
					placeholder="Add a new task"
					rows={5}
					// biome-ignore lint/a11y/noAutofocus: intentional for mobile page UX
					autoFocus
				/>

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

				<div className={styles["actions"]}>
					<Button
						type="button"
						variant="primary"
						size="lg"
						onClick={() => {
							void handleSave();
						}}
						className={styles["save-btn"]}
						disabled={isPending}
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
		</div>
	);
}
