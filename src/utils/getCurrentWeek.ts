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

	const rangeLabel = `${
		monday.toLocaleString("en-US", {
			month: "short",
		})
	} ${monday.getDate()} - ${
		(new Date(monday.getTime() + 6 * 86400000)).toLocaleString("en-US", {
			month: "short",
		})
	} ${(new Date(monday.getTime() + 6 * 86400000)).getDate()}`;

	return { days: week, rangeLabel };
}
