"use client";

import styles from "../SmartEditor.module.scss";

import { Icon } from "@atoms/Icons/Icon";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { useEffect, useRef, useState } from "react";

type BrowserSpeechRecognition = {
	start: () => void;
	stop: () => void;
	onresult: ((event: unknown) => void) | null;
	onend: (() => void) | null;
	onerror: (() => void) | null;
	continuous: boolean;
	interimResults: boolean;
	lang: string;
};

type BrowserSpeechRecognitionCtor = new() => BrowserSpeechRecognition;

type SpeechWindow = Window & {
	SpeechRecognition?: BrowserSpeechRecognitionCtor;
	webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
};

export default function SpeechToTextButtonPlugin() {
	const [editor] = useLexicalComposerContext();
	const [isSpeechAvailable, setIsSpeechAvailable] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [showLanguageHint, setShowLanguageHint] = useState(false);
	const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
	const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const SpeechRecognitionCtor = typeof window !== "undefined"
			? (window as SpeechWindow).SpeechRecognition
				|| (window as SpeechWindow).webkitSpeechRecognition
			: undefined;

		if (!SpeechRecognitionCtor) return;

		const recognition: BrowserSpeechRecognition = new SpeechRecognitionCtor();
		recognition.continuous = true;
		recognition.interimResults = false;
		recognition.lang = "en-US";

		recognition.onresult = (event) => {
			const speechEvent = event as {
				resultIndex: number;
				results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
			};
			let transcript = "";
			for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
				const result = speechEvent.results[i];
				if (result.isFinal) {
					transcript += result[0].transcript;
				}
			}

			if (!transcript.trim()) return;
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					selection.insertText(`${transcript.trim()} `);
				}
			});
		};
		recognition.onend = () => setIsListening(false);
		recognition.onerror = () => setIsListening(false);

		speechRecognitionRef.current = recognition;
		setIsSpeechAvailable(true);

		return () => {
			try {
				recognition.stop();
			} catch {
				// no-op
			}
			speechRecognitionRef.current = null;
			setIsSpeechAvailable(false);
			setIsListening(false);
			if (hintTimeoutRef.current) {
				clearTimeout(hintTimeoutRef.current);
				hintTimeoutRef.current = null;
			}
		};
	}, [editor]);

	const toggleSpeechToText = () => {
		const recognition = speechRecognitionRef.current;
		if (!recognition) return;
		setShowLanguageHint(true);
		if (hintTimeoutRef.current) {
			clearTimeout(hintTimeoutRef.current);
		}
		hintTimeoutRef.current = setTimeout(() => {
			setShowLanguageHint(false);
			hintTimeoutRef.current = null;
		}, 3000);

		if (isListening) {
			recognition.stop();
			setIsListening(false);
			return;
		}

		try {
			recognition.start();
			setIsListening(true);
		} catch {
			setIsListening(false);
		}
	};

	if (!isSpeechAvailable) return null;

	return (
		<>
			<button
				type="button"
				className={styles["smart-editor__mic-button"]}
				data-recording={isListening}
				onClick={toggleSpeechToText}
				aria-label={isListening ? "Stop dictation" : "Start dictation"}
				title={isListening ? "Recording..." : "Start voice input"}
			>
				<Icon name="Microphone" size={24} />
			</button>
			{showLanguageHint && (
				<p className={styles["smart-editor__mic-note"]} role="status" aria-live="polite">
					Speech input currently supports English only.
				</p>
			)}
		</>
	);
}
