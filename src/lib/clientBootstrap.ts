import { getCurrentWeek } from "@utils/getCurrentWeek";
import type {
	AppBootstrapPayload,
	BootstrapDailyNote,
	BootstrapTodo,
	WeekNotesPayload,
	WorkspaceTodosPayload,
} from "types/appBootstrap";

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

function hydrateWorkspaceScopedCachesFromBootstrap(
	payload: AppBootstrapPayload,
	startDate: Date,
	endDate: Date,
	requestedWorkspaceId?: string,
) {
	const effectiveWorkspaceId = requestedWorkspaceId ?? payload.activeWorkspaceId;
	const scopedWeekKey = toCacheKey(startDate, endDate, effectiveWorkspaceId);
	const activeWeekKey = toCacheKey(startDate, endDate);
	const scopedTodosKey = toTodosCacheKey(effectiveWorkspaceId);
	const activeTodosKey = toTodosCacheKey();

	notesCache.set(scopedWeekKey, payload.notes);
	todosCache.set(scopedTodosKey, payload.todos);
	cache.set(scopedWeekKey, payload);

	// Keep the generic "active" keys in sync when bootstrap resolved the active workspace.
	if (effectiveWorkspaceId === payload.activeWorkspaceId) {
		notesCache.set(activeWeekKey, payload.notes);
		todosCache.set(activeTodosKey, payload.todos);
		cache.set(activeWeekKey, payload);
	}
}

function removeWhere<T>(map: Map<string, T>, predicate: (key: string) => boolean) {
	for (const key of map.keys()) {
		if (predicate(key)) {
			map.delete(key);
		}
	}
}

async function awaitInFlightBootstrap(keys: string[]) {
	for (const key of keys) {
		const pending = inFlight.get(key);
		if (!pending) continue;
		try {
			await pending;
		} catch {
			// Ignore bootstrap failure here; caller performs its own request fallback.
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
		hydrateWorkspaceScopedCachesFromBootstrap(payload, startDate, endDate, params.workspaceId);
		return payload;
	})();

	inFlight.set(cacheKey, requestPromise);
	try {
		return await requestPromise;
	} finally {
		inFlight.delete(cacheKey);
	}
}

export function hydrateBootstrapPayload(
	payload: AppBootstrapPayload,
	params: {
		startDate?: Date;
		endDate?: Date;
		workspaceId?: string;
	} = {},
) {
	const { startDate, endDate } = getResolvedRange(params.startDate, params.endDate);
	const cacheKey = toCacheKey(startDate, endDate, params.workspaceId);
	cache.set(cacheKey, payload);
	notesCache.set(cacheKey, payload.notes);
	todosCache.set(cacheKey, payload.todos);
	hydrateWorkspaceScopedCachesFromBootstrap(payload, startDate, endDate, params.workspaceId);
}

export async function loadWeekNotes(params: BootstrapParams = {}): Promise<BootstrapDailyNote[]> {
	const { startDate, endDate } = getResolvedRange(params.startDate, params.endDate);
	const cacheKey = toCacheKey(startDate, endDate, params.workspaceId);
	const activeWeekKey = toCacheKey(startDate, endDate);

	if (notesInFlight.has(cacheKey)) {
		return notesInFlight.get(cacheKey)!;
	}
	if (!params.force) {
		if (notesCache.has(cacheKey)) return notesCache.get(cacheKey)!;
		if (cache.has(cacheKey)) return cache.get(cacheKey)!.notes;
		await awaitInFlightBootstrap([cacheKey, activeWeekKey]);
		if (notesCache.has(cacheKey)) return notesCache.get(cacheKey)!;
		if (cache.has(cacheKey)) return cache.get(cacheKey)!.notes;
		if (params.workspaceId && notesCache.has(activeWeekKey)) return notesCache.get(activeWeekKey)!;
		if (params.workspaceId && cache.has(activeWeekKey)) return cache.get(activeWeekKey)!.notes;
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
	const activeTodosKey = toTodosCacheKey();

	if (todosInFlight.has(cacheKey)) {
		return todosInFlight.get(cacheKey)!;
	}
	if (!params.force) {
		if (todosCache.has(cacheKey)) return todosCache.get(cacheKey)!;
		await awaitInFlightBootstrap(Array.from(inFlight.keys()));
		if (todosCache.has(cacheKey)) return todosCache.get(cacheKey)!;
		if (params.workspaceId && todosCache.has(activeTodosKey)) return todosCache.get(activeTodosKey)!;
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
