export function formatToDayLabel(date: Date) {
	const weekday = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
	const month = date.toLocaleDateString("en-US", { month: "short" });
	const day = date.getDate();

	return {
		weekday,
		date: `${month} ${day}`,
	};
}
