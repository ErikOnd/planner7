export function getCurrentWeek(baseDate: Date) {
	const today = new Date();
	const dayIndex = baseDate.getDay();
	const monday = new Date(baseDate);
	monday.setDate(baseDate.getDate() - ((dayIndex + 6) % 7));

	const week = [];
	const weekdayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

	for (let i = 0; i < 7; i++) {
		const date = new Date(monday);
		date.setDate(monday.getDate() + i);

		week.push({
			label: weekdayLabels[i],
			date: date.getDate().toString(),
			fullDate: date,
			isToday: date.getDate() === today.getDate()
				&& date.getMonth() === today.getMonth()
				&& date.getFullYear() === today.getFullYear(),
		});
	}

	const sunday = new Date(monday.getTime() + 6 * 86400000);
	const mondayMonth = monday.toLocaleString("en-US", { month: "short" });
	const sundayMonth = sunday.toLocaleString("en-US", { month: "short" });
	const isSameMonth = monday.getMonth() === sunday.getMonth() && monday.getFullYear() === sunday.getFullYear();
	const isSameYear = monday.getFullYear() === sunday.getFullYear();

	const rangeLabel = isSameMonth
		? `${mondayMonth} ${monday.getDate()}-${sunday.getDate()}, ${sunday.getFullYear()}`
		: isSameYear
		? `${mondayMonth} ${monday.getDate()} - ${sundayMonth} ${sunday.getDate()}, ${sunday.getFullYear()}`
		: `${mondayMonth} ${monday.getDate()}, ${monday.getFullYear()} - ${sundayMonth} ${sunday.getDate()}, ${sunday.getFullYear()}`;

	return { days: week, rangeLabel };
}
