export function isCurrentWeek(date: Date) {
	const now = new Date();
	const startOfWeek = new Date(now);
	startOfWeek.setDate(now.getDate() - now.getDay());

	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 6);

	const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

	return normalize(date) >= normalize(startOfWeek) && normalize(date) <= normalize(endOfWeek);
}
