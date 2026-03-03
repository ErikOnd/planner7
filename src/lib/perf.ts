export function logClientPerf(label: string, startMs: number, details?: Record<string, unknown>) {
	if (process.env.NODE_ENV !== "development") return;
	const elapsedMs = Math.round(performance.now() - startMs);
	if (details) {
		console.info(`[perf] ${label}: ${elapsedMs}ms`, details);
		return;
	}
	console.info(`[perf] ${label}: ${elapsedMs}ms`);
}
