"use client";

import { useEffect, useState } from "react";

export const SPEECH_LANGUAGE_STORAGE_KEY = "planner7:speech-language";

export const SPEECH_LANGUAGES = [
	{ value: "en-US", label: "English (US)" },
	{ value: "de-DE", label: "German" },
	{ value: "es-ES", label: "Spanish" },
	{ value: "fr-FR", label: "French" },
	{ value: "it-IT", label: "Italian" },
	{ value: "nl-NL", label: "Dutch" },
	{ value: "pt-BR", label: "Portuguese (BR)" },
] as const;

export type SupportedSpeechLanguage = (typeof SPEECH_LANGUAGES)[number]["value"];

export function useSpeechLanguagePreference() {
	const [speechLanguage, setSpeechLanguage] = useState<SupportedSpeechLanguage>("en-US");

	useEffect(() => {
		if (typeof window === "undefined") return;
		const saved = window.localStorage.getItem(SPEECH_LANGUAGE_STORAGE_KEY);
		if (!saved) return;
		const exists = SPEECH_LANGUAGES.some((item) => item.value === saved);
		if (exists) {
			setSpeechLanguage(saved as SupportedSpeechLanguage);
		}
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(SPEECH_LANGUAGE_STORAGE_KEY, speechLanguage);
	}, [speechLanguage]);

	return {
		speechLanguage,
		setSpeechLanguage,
	};
}
