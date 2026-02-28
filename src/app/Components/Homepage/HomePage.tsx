"use client";

import styles from "@components/Homepage/HomePage.module.scss";

import { useNotes } from "@/contexts/NotesContext";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@atoms/Button/Button";
import { Spinner } from "@atoms/Spinner/Spinner";
import { DesktopContent } from "@components/DesktopContent/DesktopContent";
import { DesktopNavigation } from "@components/DesktopNavigation/DesktopNavigation";
import { MobileNavigation } from "@components/MobileNavigation/MobileNavigation";
import { ProfileContent } from "@components/ProfileContent/ProfileContent";
import { RememberContent } from "@components/RememberContent/RememberContent";
import { Sidebar } from "@components/SideBar/Sidebar";
import { WeeklyContent } from "@components/WeeklyContent/WeeklyContent";
import { useMediaQuery } from "@hooks/useMediaQuery";
import { useWeekDisplayPreference } from "@hooks/useWeekDisplayPreference";
import * as Dialog from "@radix-ui/react-dialog";
import { getCurrentWeek } from "@utils/getCurrentWeek";
import { FormEvent, useEffect, useState } from "react";
import { getDailyGreetingDisabledKey, getDailyGreetingLastShownKey } from "../../constants/dailyGreeting";

function getTimeBasedGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 18) return "Good afternoon";
	return "Good evening";
}

function toDateKey(date: Date) {
	return date.toISOString().split("T")[0];
}

function toLocalDateKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export default function HomePage() {
	const isMobile = useMediaQuery("(max-width: 1023px)");
	const [selectedContent, setSelectedContent] = useState<"weekly" | "remember" | "profile">("weekly");
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [baseDate, setBaseDate] = useState<Date>(new Date());
	const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
	const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);
	const [nameInput, setNameInput] = useState("");
	const [isSavingName, setIsSavingName] = useState(false);
	const [namePromptError, setNamePromptError] = useState<string | null>(null);
	const [isDailyGreetingOpen, setIsDailyGreetingOpen] = useState(false);
	const { rangeLabel } = getCurrentWeek(baseDate);
	const { showWeekends, isLoading: isPreferencesLoading } = useWeekDisplayPreference();
	const { profile, isLoading: isProfileLoading, updateDisplayName } = useProfile();
	const { loadWeek } = useNotes();

	useEffect(() => {
		const { days } = getCurrentWeek(baseDate);
		const startDate = days[0].fullDate;
		const endDate = days[6].fullDate;

		loadWeek(startDate, endDate);
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

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (isProfileLoading || !profile) return;
		if (isNamePromptOpen) return;

		const disabledKey = getDailyGreetingDisabledKey(profile.email);
		const isDisabled = window.localStorage.getItem(disabledKey) === "true";
		if (isDisabled) return;

		const shownKey = getDailyGreetingLastShownKey(profile.email);
		const todayKey = toLocalDateKey(new Date());
		const lastShownDate = window.localStorage.getItem(shownKey);
		if (lastShownDate === todayKey) return;

		setIsDailyGreetingOpen(true);
		window.localStorage.setItem(shownKey, todayKey);
	}, [isNamePromptOpen, isProfileLoading, profile]);

	const handleCalendarDateSelect = (date: Date) => {
		setBaseDate(date);
		setHighlightedDate(date);
		setTimeout(() => setHighlightedDate(null), 3000);
	};

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

	const handleStartVoiceWelcome = () => {
		setIsDailyGreetingOpen(false);
		const today = new Date();
		const todayKey = toDateKey(today);

		setBaseDate(today);
		setSelectedDate(today);
		setHighlightedDate(today);

		if (isMobile) {
			setSelectedContent("weekly");
		}

		const scrollToTodayBlock = (attempt = 0) => {
			const todayBlock = document.getElementById(`daily-note-${todayKey}`);
			if (todayBlock) {
				todayBlock.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
				window.dispatchEvent(new CustomEvent("planner:start-ai-voice-note", { detail: { targetEditorId: todayKey } }));
				return;
			}
			if (attempt >= 10) {
				window.dispatchEvent(new CustomEvent("planner:start-ai-voice-note", { detail: { targetEditorId: todayKey } }));
				return;
			}
			window.setTimeout(() => scrollToTodayBlock(attempt + 1), 120);
		};

		window.setTimeout(() => scrollToTodayBlock(), 140);
	};

	const renderMobileContent = () => {
		switch (selectedContent) {
			case "weekly":
				return <WeeklyContent selectedDate={selectedDate} />;
			case "remember":
				return <RememberContent />;
			case "profile":
				return <ProfileContent />;
			default:
				return null;
		}
	};

	if (isPreferencesLoading) {
		return (
			<main className={styles["home-page"]}>
				<div className={styles["home-page-loading"]}>
					<Spinner />
				</div>
			</main>
		);
	}

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
							setBaseDateAction={setBaseDate}
							showWeekends={showWeekends}
						/>
						{renderMobileContent()}
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
			<Dialog.Root open={isDailyGreetingOpen} onOpenChange={setIsDailyGreetingOpen}>
				<Dialog.Portal>
					<Dialog.Overlay className={styles["daily-greeting-overlay"]} />
					<Dialog.Content className={styles["daily-greeting-dialog"]}>
						<Dialog.Title className={styles["daily-greeting-title"]}>
							{getTimeBasedGreeting()}
							{profile?.displayName ? `, ${profile.displayName}` : ""}!
						</Dialog.Title>
						<Dialog.Description className={styles["daily-greeting-description"]}>
							Capture your thoughts naturally. AI will turn your voice into clear, structured notes with headings,
							lists, and checkboxes.
						</Dialog.Description>
						<div className={styles["daily-greeting-actions"]}>
							<Button
								type="button"
								variant="ai"
								fontWeight={700}
								icon="ai-sparkles"
								iconSize={32}
								onClick={handleStartVoiceWelcome}
							>
								Start with AI voice notes
							</Button>
							<Button
								type="button"
								variant="secondary"
								fontWeight={600}
								onClick={() => setIsDailyGreetingOpen(false)}
							>
								Not today
							</Button>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</main>
	);
}
