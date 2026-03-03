import type {
	AppBootstrapPayload,
	BootstrapDailyNote,
	BootstrapTodo,
	WeekNotesPayload,
	WorkspaceTodosPayload,
} from "types/appBootstrap";
import { getCurrentWeek } from "@utils/getCurrentWeek";

type BootstrapParams = {
	startDate?: Date;
	endDate?: Date;
	workspaceId?: string;
	force?: boolean;
};

const inFlight = new Map<string, Promise<AppBootstrapPayload>>();
const cache = new Map<string, AppBootstrapPayload>();
const notesInFlight = new Map<string, Promise<BootstrapDailyNote[]>>();
const notesCache = new Map<string, BootstrapDailyNote[]>();
const todosInFlight = new Map<string, Promise<BootstrapTodo[]>>();
const todosCache = new Map<string, BootstrapTodo[]>();

function toDateParam(date: Date) {
	return date.toISOString().split("T")[0];
}

function getResolvedRange(startDate?: Date, endDate?: Date) {
	if (startDate && endDate) {
		return { startDate, endDate };
	}

	const { days } = getCurrentWeek(new Date());
	return {
		startDate: days[0].fullDate,
		endDate: days[6].fullDate,
	};
}

function toCacheKey(startDate: Date, endDate: Date, workspaceId?: string) {
	return `${workspaceId ?? "active"}:${toDateParam(startDate)}:${toDateParam(endDate)}`;
}

function toTodosCacheKey(workspaceId?: string) {
	return `todos:${workspaceId ?? "active"}`;
}

function removeWhere<T>(map: Map<string, T>, predicate: (key: string) => boolean) {
	for (const key of map.keys()) {
		if (predicate(key)) {
			map.delete(key);
		}
	}
}

export async function loadAppBootstrap(params: BootstrapParams = {}): Promise<AppBootstrapPayload> {
	const { startDate, endDate } = getResolvedRange(params.startDate, params.endDate);
	const cacheKey = toCacheKey(startDate, endDate, params.workspaceId);

	if (inFlight.has(cacheKey)) {
		return inFlight.get(cacheKey)!;
	}

	if (!params.force && cache.has(cacheKey)) {
		return cache.get(cacheKey)!;
	}

	const requestPromise = (async () => {
		const query = new URLSearchParams({
			startDate: toDateParam(startDate),
			endDate: toDateParam(endDate),
		});
		if (params.workspaceId) {
			query.set("workspaceId", params.workspaceId);
		}

		const response = await fetch(`/api/app/bootstrap?${query.toString()}`, {
			method: "GET",
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`Bootstrap request failed (${response.status})`);
		}

		const payload = (await response.json()) as AppBootstrapPayload;
		cache.set(cacheKey, payload);
		notesCache.set(cacheKey, payload.notes);
		todosCache.set(cacheKey, payload.todos);
		return payload;
	})();

	inFlight.set(cacheKey, requestPromise);
	try {
		return await requestPromise;
	} finally {
		inFlight.delete(cacheKey);
	}
}

export async function loadWeekNotes(params: BootstrapParams = {}): Promise<BootstrapDailyNote[]> {
	const { startDate, endDate } = getResolvedRange(params.startDate, params.endDate);
	const cacheKey = toCacheKey(startDate, endDate, params.workspaceId);

	if (notesInFlight.has(cacheKey)) {
		return notesInFlight.get(cacheKey)!;
	}
	if (!params.force) {
		if (notesCache.has(cacheKey)) return notesCache.get(cacheKey)!;
		if (cache.has(cacheKey)) return cache.get(cacheKey)!.notes;
	}

	const requestPromise = (async () => {
		const query = new URLSearchParams({
			startDate: toDateParam(startDate),
			endDate: toDateParam(endDate),
			mode: "notes",
		});
		if (params.workspaceId) {
			query.set("workspaceId", params.workspaceId);
		}

		const response = await fetch(`/api/app/bootstrap?${query.toString()}`, {
			method: "GET",
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`Week notes request failed (${response.status})`);
		}

		const payload = (await response.json()) as WeekNotesPayload;
		notesCache.set(cacheKey, payload.notes);
		return payload.notes;
	})();

	notesInFlight.set(cacheKey, requestPromise);
	try {
		return await requestPromise;
	} finally {
		notesInFlight.delete(cacheKey);
	}
}

export async function loadWorkspaceTodos(params: BootstrapParams = {}): Promise<BootstrapTodo[]> {
	const cacheKey = toTodosCacheKey(params.workspaceId);

	if (todosInFlight.has(cacheKey)) {
		return todosInFlight.get(cacheKey)!;
	}
	if (!params.force) {
		if (todosCache.has(cacheKey)) return todosCache.get(cacheKey)!;
		if (cache.has(cacheKey)) return cache.get(cacheKey)!.todos;
	}

	const requestPromise = (async () => {
		const query = new URLSearchParams({
			mode: "todos",
		});
		if (params.workspaceId) {
			query.set("workspaceId", params.workspaceId);
		}

		const response = await fetch(`/api/app/bootstrap?${query.toString()}`, {
			method: "GET",
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`Workspace todos request failed (${response.status})`);
		}

		const payload = (await response.json()) as WorkspaceTodosPayload;
		todosCache.set(cacheKey, payload.todos);
		return payload.todos;
	})();

	todosInFlight.set(cacheKey, requestPromise);
	try {
		return await requestPromise;
	} finally {
		todosInFlight.delete(cacheKey);
	}
}

export function clearAppBootstrapCache() {
	cache.clear();
	inFlight.clear();
	notesCache.clear();
	notesInFlight.clear();
	todosCache.clear();
	todosInFlight.clear();
}

export function invalidateWorkspaceNotesCache(workspaceId?: string) {
	const prefix = `${workspaceId ?? "active"}:`;
	removeWhere(notesCache, (key) => key.startsWith(prefix));
	removeWhere(notesInFlight, (key) => key.startsWith(prefix));
	// full bootstrap payload also contains notes for that workspace/week
	removeWhere(cache, (key) => key.startsWith(prefix));
	removeWhere(inFlight, (key) => key.startsWith(prefix));
}

export function invalidateWorkspaceTodosCache(workspaceId?: string) {
	const todosKey = toTodosCacheKey(workspaceId);
	todosCache.delete(todosKey);
	todosInFlight.delete(todosKey);

	const prefix = `${workspaceId ?? "active"}:`;
	// full bootstrap payload also contains todos
	removeWhere(cache, (key) => key.startsWith(prefix));
	removeWhere(inFlight, (key) => key.startsWith(prefix));
}

export function invalidateProfileAndPreferencesCache() {
	// profile and preferences are loaded from the full bootstrap payload.
	cache.clear();
	inFlight.clear();
}

export function invalidateWorkspaceTopologyCache() {
	// workspace create/rename/delete/switch impacts all workspace-scoped caches.
	clearAppBootstrapCache();
}
