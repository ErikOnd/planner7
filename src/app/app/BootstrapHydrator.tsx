"use client";

import { hydrateBootstrapPayload } from "@/lib/clientBootstrap";
import { type ReactNode, useMemo } from "react";
import type { AppBootstrapPayload } from "types/appBootstrap";

/**
 * Hydrates the client-side bootstrap cache synchronously during render,
 * before any context useEffects fire. This eliminates the network round-trip
 * for the initial bootstrap fetch when the server has already fetched the data.
 *
 * The server-computed startDate/endDate are passed explicitly so the cache key
 * matches exactly — avoiding any edge-case mismatch at week boundaries.
 */
export function BootstrapHydrator({
	payload,
	startDate,
	endDate,
	children,
}: {
	payload: AppBootstrapPayload;
	startDate: string;
	endDate: string;
	children: ReactNode;
}) {
	// useMemo with empty deps runs once, synchronously during the first render —
	// before any useEffect in this component or its parent providers fires.
	useMemo(() => {
		hydrateBootstrapPayload(payload, {
			startDate: new Date(startDate),
			endDate: new Date(endDate),
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <>{children}</>;
}
