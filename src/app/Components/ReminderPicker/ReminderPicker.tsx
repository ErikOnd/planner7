"use client";

import {
	formatDateLabel,
	type ReminderPickerStep,
	sanitizeTimeInput,
	toLocalDateValue,
} from "@/lib/taskReminderPicker";
import { Button } from "@atoms/Button/Button";
import { CalendarPanel } from "@atoms/CalendarOverlay/CalendarOverlay";
import { Icon } from "@atoms/Icons/Icon";
import { type RefObject, useRef } from "react";

type PickerStyles = { readonly [key: string]: string };

type TimeInputColumnProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	onBlur: () => void;
	onStep: (delta: number) => void;
	inputRef: RefObject<HTMLInputElement | null>;
	enterKeyHint: "next" | "done";
	onEnter?: () => void;
	onFilled?: () => void;
	styles: PickerStyles;
};

function TimeInputColumn(props: TimeInputColumnProps) {
	const {
		label,
		value,
		onChange,
		onBlur,
		onStep,
		inputRef,
		enterKeyHint,
		onEnter,
		onFilled,
		styles,
	} = props;

	return (
		<div className={styles["time-picker-column"]}>
			<button
				type="button"
				className={styles["time-picker-step"]}
				onClick={() => onStep(1)}
				aria-label={`Increase ${label.toLowerCase()}`}
			>
				<Icon name="chevron-right" size={16} className={styles["time-picker-step-icon--up"]} />
			</button>
			<input
				ref={inputRef}
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				enterKeyHint={enterKeyHint}
				maxLength={2}
				className={styles["time-picker-input"]}
				value={value}
				onChange={(event) => {
					const nextValue = sanitizeTimeInput(event.target.value);
					onChange(nextValue);
					if (nextValue.length >= 2) {
						onFilled?.();
					}
				}}
				onBlur={onBlur}
				onFocus={(event) => event.currentTarget.select()}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						onEnter?.();
					}
				}}
				aria-label={label}
			/>
			<button
				type="button"
				className={styles["time-picker-step"]}
				onClick={() => onStep(-1)}
				aria-label={`Decrease ${label.toLowerCase()}`}
			>
				<Icon name="chevron-right" size={16} className={styles["time-picker-step-icon--down"]} />
			</button>
		</div>
	);
}

type ReminderPickerOverlayProps = {
	step: ReminderPickerStep | null;
	reminderDate: string;
	pickerHour: string;
	pickerMinute: string;
	onClose: () => void;
	onDateSelect: (date: Date) => void;
	onBackToCalendar: () => void;
	onConfirm: () => void;
	onHourChange: (value: string) => void;
	onHourBlur: () => void;
	onHourStep: (delta: number) => void;
	onMinuteChange: (value: string) => void;
	onMinuteBlur: () => void;
	onMinuteStep: (delta: number) => void;
	styles: PickerStyles;
};

export function ReminderPickerOverlay(props: ReminderPickerOverlayProps) {
	const {
		step,
		reminderDate,
		pickerHour,
		pickerMinute,
		onClose,
		onDateSelect,
		onBackToCalendar,
		onConfirm,
		onHourChange,
		onHourBlur,
		onHourStep,
		onMinuteChange,
		onMinuteBlur,
		onMinuteStep,
		styles,
	} = props;

	const minuteInputRef = useRef<HTMLInputElement>(null);
	const hourInputRef = useRef<HTMLInputElement>(null);

	if (!step) return null;

	return (
		<div className={styles["picker-layer"]}>
			<div className={styles["picker-overlay"]} onClick={onClose} aria-hidden="true" />
			<div
				className={styles["picker-dialog"]}
				role="dialog"
				aria-label={step === "calendar" ? "Select reminder date" : "Set reminder time"}
			>
				{step === "calendar"
					? (
						<CalendarPanel
							className={styles["picker-calendar"]}
							activeDate={toLocalDateValue(reminderDate)}
							onDateSelect={onDateSelect}
						/>
					)
					: (
						<div className={styles["time-picker"]}>
							<div className={styles["time-picker-header"]}>
								<div className={styles["time-picker-heading"]}>
									<p className={styles["time-picker-title"]}>Set Time</p>
									<p className={styles["time-picker-subtitle"]}>
										Schedule for {formatDateLabel(reminderDate)}
									</p>
								</div>
								<button
									type="button"
									className={styles["time-picker-change-date"]}
									onClick={onBackToCalendar}
								>
									<Icon name="calendar" size={14} />
									Change date
								</button>
							</div>

							<div className={styles["time-picker-controls"]}>
								<TimeInputColumn
									label="Hour"
									value={pickerHour}
									onChange={onHourChange}
									onBlur={onHourBlur}
									onStep={onHourStep}
									inputRef={hourInputRef}
									enterKeyHint="next"
									onEnter={() => minuteInputRef.current?.focus()}
									onFilled={() => minuteInputRef.current?.focus()}
									styles={styles}
								/>
								<div className={styles["time-picker-separator"]}>:</div>
								<TimeInputColumn
									label="Minute"
									value={pickerMinute}
									onChange={onMinuteChange}
									onBlur={onMinuteBlur}
									onStep={onMinuteStep}
									inputRef={minuteInputRef}
									enterKeyHint="done"
									onEnter={onConfirm}
									styles={styles}
								/>
							</div>

							<div className={styles["time-picker-actions"]}>
								<Button
									type="button"
									variant="secondary"
									size="base"
									className={styles["time-picker-action"]}
									onClick={onClose}
								>
									Cancel
								</Button>
								<Button
									type="button"
									variant="primary"
									size="base"
									className={styles["time-picker-action"]}
									onClick={onConfirm}
								>
									Confirm
								</Button>
							</div>
						</div>
					)}
			</div>
		</div>
	);
}
