export type TodoGreeting = {
	headline: string;
	subline: string;
};

type GreetingBucket = "middleOfNight" | "earlyMorning" | "lateMorning" | "afternoon" | "lateAfternoon" | "evening";

const TODO_GREETINGS: Record<GreetingBucket, TodoGreeting[]> = {
	middleOfNight: [
		{ headline: "Midnight mode", subline: "Capture the thought before it disappears." },
		{ headline: "Night owl session", subline: "Drop quick todos and clear your mind." },
		{ headline: "Quiet hours", subline: "Plan now, execute later with a fresh head." },
		{ headline: "After-hours planning", subline: "Write it down so tomorrow starts clean." },
		{ headline: "Moonlight list", subline: "Quick note now, less stress at sunrise." },
		{ headline: "Low-noise focus", subline: "A tiny plan tonight saves energy tomorrow." },
		{ headline: "2AM brain dump", subline: "Get it out of your head and onto the list." },
		{ headline: "Night shift clarity", subline: "Sort urgent, important, and can-wait." },
	],
	earlyMorning: [
		{ headline: "Fresh start", subline: "Pick your top 3 and win the morning." },
		{ headline: "Sunrise planning", subline: "Set priorities before the day gets noisy." },
		{ headline: "Morning momentum", subline: "One focused task can set the tone." },
		{ headline: "Early focus", subline: "Turn your intentions into actionable todos." },
		{ headline: "Coffee + clarity", subline: "First sip, first priority, first win." },
		{ headline: "Breathe and begin", subline: "Start with the hardest task while focus is fresh." },
		{ headline: "Quiet morning edge", subline: "Protect this hour for meaningful progress." },
		{ headline: "Strong start", subline: "Clear plan, calm mind, faster execution." },
	],
	lateMorning: [
		{ headline: "Deep work window", subline: "Lock in and move the backlog forward." },
		{ headline: "Productive stride", subline: "Batch small tasks, then attack one big one." },
		{ headline: "Flow check", subline: "Trim distractions and finish what matters." },
		{ headline: "Execution time", subline: "Keep your list tight and your focus tighter." },
		{ headline: "Second wind, first results", subline: "Ship one meaningful task before lunch." },
		{ headline: "Focus lane", subline: "Let the backlog shrink one clean task at a time." },
		{ headline: "Priority lock", subline: "Protect your top task from interruptions." },
		{ headline: "Build momentum", subline: "Done beats perfect. Close the next loop." },
	],
	afternoon: [
		{ headline: "Afternoon push", subline: "Close open loops before they pile up." },
		{ headline: "Second-half sprint", subline: "Move one key task to done right now." },
		{ headline: "Backlog breaker", subline: "Knock out medium tasks while energy is steady." },
		{ headline: "Keep it rolling", subline: "Small completions compound fast." },
		{ headline: "Post-lunch reset", subline: "Pick one task and restart your momentum." },
		{ headline: "Refocus round", subline: "Turn that mental tab into a completed item." },
		{ headline: "Task streak", subline: "Three quick completions can revive the day." },
		{ headline: "Steady progress", subline: "Less context switching, more finishing." },
	],
	lateAfternoon: [
		{ headline: "Wrap-up run", subline: "Finish strong and queue tomorrow’s first move." },
		{ headline: "End-of-day clarity", subline: "Sort what’s done, what’s next, what can wait." },
		{ headline: "Final stretch", subline: "Ship one more important task." },
		{ headline: "Desk reset", subline: "Leave your future self a clean plan." },
		{ headline: "Last checkpoint", subline: "Close one loop before signing off." },
		{ headline: "Landing sequence", subline: "Capture leftovers and set tomorrow’s starter task." },
		{ headline: "Clean finish", subline: "Review wins, archive noise, keep what matters." },
		{ headline: "Closing rhythm", subline: "Short plan now, smoother morning later." },
	],
	evening: [
		{ headline: "Evening review", subline: "Capture wins and prep tomorrow’s priorities." },
		{ headline: "Calm planning", subline: "Light planning now makes mornings easier." },
		{ headline: "Wind-down list", subline: "Park every open thought in one place." },
		{ headline: "Tomorrow setup", subline: "Define the first task for an easier start." },
		{ headline: "Quiet planning", subline: "Keep it light: one plan, three priorities." },
		{ headline: "Soft close", subline: "Write tomorrow’s first move before you log off." },
		{ headline: "Evening brain sweep", subline: "Collect loose tasks so your mind can rest." },
		{ headline: "Night prep", subline: "Plan less, sleep better, execute faster tomorrow." },
	],
};

function pickBucket(hour: number): GreetingBucket {
	if (hour < 5) return "middleOfNight";
	if (hour < 9) return "earlyMorning";
	if (hour < 12) return "lateMorning";
	if (hour < 16) return "afternoon";
	if (hour < 20) return "lateAfternoon";
	return "evening";
}

function pickRandom<T>(items: T[]): T {
	return items[Math.floor(Math.random() * items.length)];
}

export function getRandomTodoGreeting(date: Date = new Date()): TodoGreeting {
	const bucket = pickBucket(date.getHours());
	return pickRandom(TODO_GREETINGS[bucket]);
}
