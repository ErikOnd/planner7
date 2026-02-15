"use client";

import styles from "@components/Homepage/HomePage.module.scss";

import { useNotes } from "@/contexts/NotesContext";
import { Spinner } from "@atoms/Spinner/Spinner";
import { DesktopContent } from "@components/DesktopContent/DesktopContent";
import { DesktopNavigation } from "@components/DesktopNavigation/DesktopNavigation";
import { MobileNavigation } from "@components/MobileNavigation/MobileNavigation";
import { ProfileContent } from "@components/ProfileContent/ProfileContent";
import { RememberContent } from "@components/RememberContent/RememberContent";
import { Sidebar } from "@components/SideBar/Sidebar";
import { WeeklyContent } from "@components/WeeklyContent/WeeklyContent";
import { useGeneralTodos } from "@hooks/useGeneralTodos";
import { useMediaQuery } from "@hooks/useMediaQuery";
import { useWeekDisplayPreference } from "@hooks/useWeekDisplayPreference";
import { getCurrentWeek } from "@utils/getCurrentWeek";
import { useEffect, useState } from "react";

export default function HomePage() {
	const isMobile = useMediaQuery("(max-width: 1023px)");
	const [selectedContent, setSelectedContent] = useState<"weekly" | "remember" | "profile">("weekly");
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [baseDate, setBaseDate] = useState<Date>(new Date());
	const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
	const { rangeLabel } = getCurrentWeek(baseDate);
	const { showWeekends, isLoading: isPreferencesLoading } = useWeekDisplayPreference();

	const todosState = useGeneralTodos();
	const { loadWeek } = useNotes();

	useEffect(() => {
		const { days } = getCurrentWeek(baseDate);
		const startDate = days[0].fullDate;
		const endDate = days[6].fullDate;

		loadWeek(startDate, endDate);
	}, [baseDate, loadWeek]);

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

	const handleCalendarDateSelect = (date: Date) => {
		setBaseDate(date);
		setHighlightedDate(date);
		setTimeout(() => setHighlightedDate(null), 3000);
	};

	const renderMobileContent = () => {
		switch (selectedContent) {
			case "weekly":
				return <WeeklyContent selectedDate={selectedDate} />;
			case "remember":
				return <RememberContent todosState={todosState} />;
			case "profile":
				return <ProfileContent />;
			default:
				return null;
		}
	};

	if (isPreferencesLoading) {
		return (
			<main className={styles["home-page"]}>
				<div style={{ display: "flex", justifyContent: "center", paddingTop: "5rem", paddingBottom: "2rem" }}>
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
							<Sidebar todosState={todosState} />
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
		</main>
	);
}
