"use client";

import type { Block } from "@blocknote/core";
import { useCallback, useRef } from "react";

type DailyNotesCache = {
	[dateString: string]: Block[] | undefined;
};

export function useDailyNotesCache() {
	const cacheRef = useRef<DailyNotesCache>({});

	const setCache = useCallback((dateString: string, content: Block[] | undefined) => {
		cacheRef.current[dateString] = content;
	}, []);

	const getCache = useCallback((dateString: string): Block[] | undefined => {
		return cacheRef.current[dateString];
	}, []);

	return {
		setCache,
		getCache,
	};
}
