"use client";

import { DAILY_VOICE_LIMIT_SECONDS } from "@/lib/voiceQuota";
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";

type VoiceUsageResponse = {
	success: boolean;
	remainingSeconds?: number;
	limitSeconds?: number;
	quotaEnabled?: boolean;
};

type VoiceUsageContextType = {
	remainingSeconds: number;
	limitSeconds: number;
	quotaEnabled: boolean;
	isLoading: boolean;
	isLoaded: boolean;
	ensureLoaded: () => Promise<number>;
	refresh: () => Promise<number>;
	setRemainingSeconds: (seconds: number) => void;
};

const VoiceUsageContext = createContext<VoiceUsageContextType | undefined>(undefined);

export function VoiceUsageProvider({ children }: { children: ReactNode }) {
	const [remainingSeconds, setRemainingSecondsState] = useState<number>(DAILY_VOICE_LIMIT_SECONDS);
	const [limitSeconds, setLimitSeconds] = useState<number>(DAILY_VOICE_LIMIT_SECONDS);
	const [quotaEnabled, setQuotaEnabled] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const inFlightRequestRef = useRef<Promise<number> | null>(null);

	const applyPayload = useCallback((payload: VoiceUsageResponse): number => {
		const nextLimit = payload.limitSeconds ?? DAILY_VOICE_LIMIT_SECONDS;
		const nextRemaining = payload.remainingSeconds ?? (payload.success ? nextLimit : 0);
		const nextQuotaEnabled = payload.quotaEnabled !== false;
		setLimitSeconds(nextLimit);
		setRemainingSecondsState(nextRemaining);
		setQuotaEnabled(nextQuotaEnabled);
		return nextRemaining;
	}, []);

	const fetchUsage = useCallback(async (): Promise<number> => {
		if (inFlightRequestRef.current) {
			return inFlightRequestRef.current;
		}

		const request = (async () => {
			try {
				setIsLoading(true);
				const response = await fetch("/api/ai/voice-usage", {
					method: "GET",
					cache: "no-store",
				});
				const payload = (await response.json()) as VoiceUsageResponse;
				const nextRemaining = applyPayload(payload);
				setIsLoaded(true);
				return nextRemaining;
			} catch {
				setQuotaEnabled(false);
				setRemainingSecondsState(0);
				setIsLoaded(true);
				return 0;
			} finally {
				setIsLoading(false);
				inFlightRequestRef.current = null;
			}
		})();

		inFlightRequestRef.current = request;
		return request;
	}, [applyPayload]);

	const ensureLoaded = useCallback(async () => {
		if (isLoaded) return remainingSeconds;
		return fetchUsage();
	}, [fetchUsage, isLoaded, remainingSeconds]);

	const refresh = useCallback(async () => {
		return fetchUsage();
	}, [fetchUsage]);

	const setRemainingSeconds = useCallback((seconds: number) => {
		setRemainingSecondsState(Math.max(0, Math.floor(seconds)));
		setIsLoaded(true);
	}, []);

	return (
		<VoiceUsageContext.Provider
			value={{
				remainingSeconds,
				limitSeconds,
				quotaEnabled,
				isLoading,
				isLoaded,
				ensureLoaded,
				refresh,
				setRemainingSeconds,
			}}
		>
			{children}
		</VoiceUsageContext.Provider>
	);
}

export function useVoiceUsage() {
	const context = useContext(VoiceUsageContext);
	if (!context) {
		throw new Error("useVoiceUsage must be used within a VoiceUsageProvider");
	}
	return context;
}
