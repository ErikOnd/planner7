"use client";

import styles from "@components/Homepage/HomePage.module.scss";

import { useBacklog } from "@/contexts/BacklogContext";
import { useNotes } from "@/contexts/NotesContext";
import { useProfile } from "@/contexts/ProfileContext";
import { logClientPerf } from "@/lib/perf";
import { Button } from "@atoms/Button/Button";
import { CalendarPanel } from "@atoms/CalendarOverlay/CalendarOverlay";
import { DesktopContent } from "@components/DesktopContent/DesktopContent";
import { DesktopNavigation } from "@components/DesktopNavigation/DesktopNavigation";
import { FeedbackPanel } from "@components/FeedbackDialog/FeedbackDialog";
import { MobileAddTaskPage } from "@components/MobileAddTaskPage/MobileAddTaskPage";
import { MobileNavigation, type MobileSection } from "@components/MobileNavigation/MobileNavigation";
import { ProfileContent } from "@components/ProfileContent/ProfileContent";
import { RememberContent } from "@components/RememberContent/RememberContent";
import { Sidebar } from "@components/SideBar/Sidebar";
import { WeeklyContent } from "@components/WeeklyContent/WeeklyContent";
import { WorkspacePanel } from "@components/WorkspaceSwitcher/WorkspaceSwitcher";
import { useMediaQuery } from "@hooks/useMediaQuery";
import { useWeekDisplayPreference } from "@hooks/useWeekDisplayPreference";
import * as Dialog from "@radix-ui/react-dialog";
import { getCurrentWeek } from "@utils/getCurrentWeek";
import clsx from "clsx";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function HomePage() {
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [selectedContent, setSelectedContent] = useState<MobileSection>("weekly");
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [baseDate, setBaseDate] = useState<Date>(new Date());
	const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
	const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);
	const [nameInput, setNameInput] = useState("");
	const [isSavingName, setIsSavingName] = useState(false);
	const [namePromptError, setNamePromptError] = useState<string | null>(null);
	const { rangeLabel } = getCurrentWeek(baseDate);
	const { showWeekends } = useWeekDisplayPreference();
	const { profile, isLoading: isProfileLoading, updateDisplayName } = useProfile();
	const { loadWeek } = useNotes();
	const { addTodo, silentRefresh } = useBacklog();

	useEffect(() => {
		let cancelled = false;
		const startedAt = performance.now();

		const currentWeek = getCurrentWeek(baseDate);
		const startDate = currentWeek.days[0].fullDate;
		const endDate = currentWeek.days[6].fullDate;

		void (async () => {
			await loadWeek(startDate, endDate);
			if (cancelled) return;
			logClientPerf("homepage.currentWeek.ready", startedAt);

			const schedulePrefetch = () => {
				if (cancelled) return;
				const nextBase = new Date(baseDate);
				nextBase.setDate(nextBase.getDate() + 7);
				const nextWeek = getCurrentWeek(nextBase);

				void loadWeek(nextWeek.days[0].fullDate, nextWeek.days[6].fullDate);

				// Prefetch the previous week only after a small delay to reduce immediate startup pressure.
				const prefetchPrevious = () => {
					if (cancelled) return;
					const prevBase = new Date(baseDate);
					prevBase.setDate(prevBase.getDate() - 7);
					const prevWeek = getCurrentWeek(prevBase);
					void loadWeek(prevWeek.days[0].fullDate, prevWeek.days[6].fullDate);
				};

				window.setTimeout(prefetchPrevious, 1400);
			};

			if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
				window.requestIdleCallback(schedulePrefetch, { timeout: 1000 });
				return;
			}
			window.setTimeout(schedulePrefetch, 250);
		})();

		return () => {
			cancelled = true;
		};
	}, [baseDate, loadWeek]);

	useEffect(() => {
		void import("@atoms/SmartEditor/SmartEditor");
	}, []);

	useEffect(() => {
		if (showWeekends) return;

		const dayIndex = selectedDate.getDay();
		if (dayIndex >= 1 && dayIndex <= 5) return;

		const { days } = getCurrentWeek(baseDate);
		const firstWeekday = days.find((day) => {
			const dayOfWeek = day.fullDate.getDay();
			return dayOfWeek >= 1 && dayOfWeek <= 5;
		});

		if (firstWeekday) {
			setSelectedDate(firstWeekday.fullDate);
		}
	}, [showWeekends, selectedDate, baseDate]);

	useEffect(() => {
		if (isProfileLoading || !profile) return;
		const currentName = profile.displayName?.trim() ?? "";
		setNameInput(currentName);
		setIsNamePromptOpen(currentName.length === 0);
	}, [isProfileLoading, profile]);

	const handleCalendarDateSelect = (date: Date) => {
		setBaseDate(date);
		setHighlightedDate(date);
		setTimeout(() => setHighlightedDate(null), 3000);
	};

	const handleMobileWeekChange = useCallback((nextBaseDate: Date) => {
		const { days } = getCurrentWeek(nextBaseDate);
		const visibleDays = showWeekends
			? days
			: days.filter(({ fullDate }) => {
				const dayIndex = fullDate.getDay();
				return dayIndex >= 1 && dayIndex <= 5;
			});
		const selectedWeekday = selectedDate.getDay();
		const nextSelectedDate = visibleDays.find(({ fullDate }) => fullDate.getDay() === selectedWeekday)?.fullDate
			?? visibleDays.find(({ fullDate }) => fullDate.toDateString() === nextBaseDate.toDateString())?.fullDate
			?? visibleDays[0]?.fullDate
			?? nextBaseDate;

		setBaseDate(nextBaseDate);
		setSelectedDate(nextSelectedDate);
	}, [selectedDate, showWeekends]);

	const handleMobileCalendarDateSelect = useCallback((date: Date) => {
		setSelectedContent("weekly");
		setBaseDate(date);
		setSelectedDate(date);
	}, []);

	const handleSaveName = async (event: FormEvent) => {
		event.preventDefault();
		const normalized = nameInput.trim();
		if (!normalized) {
			setNamePromptError("Please enter your name.");
			return;
		}

		setIsSavingName(true);
		setNamePromptError(null);
		const result = await updateDisplayName(normalized);
		if (!result.success) {
			setNamePromptError(result.error ?? "Failed to save your name.");
			setIsSavingName(false);
			return;
		}

		setIsNamePromptOpen(false);
		setIsSavingName(false);
	};

	const renderMobileContent = () => {
		switch (selectedContent) {
			case "weekly":
				return <WeeklyContent selectedDate={selectedDate} />;
			case "remember":
				return <RememberContent />;
			case "add-task":
				return (
					<MobileAddTaskPage
						onDone={() => setSelectedContent("remember")}
						onOptimisticAdd={addTodo}
						onSuccess={silentRefresh}
					/>
				);
			case "feedback":
				return <FeedbackPanel className={styles["mobile-feedback-panel"]} />;
			case "calendar":
				return (
					<CalendarPanel
						onDateSelect={handleMobileCalendarDateSelect}
						activeDate={selectedDate}
						showWeekends={showWeekends}
						page
					/>
				);
			case "workspace":
				return (
					<WorkspacePanel
						className={styles["mobile-workspace-panel"]}
						onAfterSwitch={() => setSelectedContent("weekly")}
					/>
				);
			case "profile":
				return <ProfileContent />;
			default:
				return null;
		}
	};

	return (
		<main className={styles["home-page"]}>
			{isMobile
				? (
					<div className={styles["mobile-view"]}>
						<MobileNavigation
							content={selectedContent}
							onChangeAction={setSelectedContent}
							selectedDate={selectedDate}
							onSelectDateAction={setSelectedDate}
							baseDate={baseDate}
							setBaseDateAction={handleMobileWeekChange}
							showWeekends={showWeekends}
							onOpenAddAction={() => setSelectedContent("add-task")}
						/>
						<div
							className={clsx(
								styles["mobile-content"],
								selectedContent === "weekly" && styles["mobile-content--planner"],
								selectedContent !== "weekly" && styles["mobile-content--secondary"],
								(selectedContent === "calendar" || selectedContent === "add-task") && styles["mobile-content--page"],
							)}
						>
							{renderMobileContent()}
						</div>
					</div>
				)
				: (
					<div className={styles["desktop-view"]}>
						<div className={styles["desktop-layout"]}>
							<Sidebar />
							<div className={styles["desktop-main"]}>
								<DesktopNavigation
									rangeLabel={rangeLabel}
									onDateSelect={handleCalendarDateSelect}
									activeDate={baseDate}
									baseDate={baseDate}
									setBaseDateAction={setBaseDate}
									showWeekends={showWeekends}
								/>
								<DesktopContent
									baseDate={baseDate}
									highlightedDate={highlightedDate}
									showWeekends={showWeekends}
								/>
							</div>
						</div>
					</div>
				)}
			<Dialog.Root open={isNamePromptOpen}>
				<Dialog.Portal>
					<Dialog.Overlay className={styles["name-prompt-overlay"]} />
					<Dialog.Content
						className={styles["name-prompt-dialog"]}
						onEscapeKeyDown={(event) => event.preventDefault()}
						onInteractOutside={(event) => event.preventDefault()}
					>
						<Dialog.Title className={styles["name-prompt-title"]}>Welcome to Planner7</Dialog.Title>
						<Dialog.Description className={styles["name-prompt-description"]}>
							Before we get started, what should we call you?
						</Dialog.Description>
						<form className={styles["name-prompt-form"]} onSubmit={handleSaveName}>
							<input
								type="text"
								value={nameInput}
								onChange={(event) => setNameInput(event.target.value)}
								className={styles["name-prompt-input"]}
								placeholder="Your name"
								maxLength={60}
								autoFocus
							/>
							{namePromptError && <p className={styles["name-prompt-error"]}>{namePromptError}</p>}
							<Button type="submit" variant="primary" fontWeight={700} disabled={isSavingName}>
								Continue
							</Button>
						</form>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</main>
	);
}
