"use client";

import styles from "../SmartEditor.module.scss";

import { DAILY_VOICE_LIMIT_SECONDS, formatRemainingVoiceSeconds } from "@/lib/voiceQuota";
import { Icon } from "@atoms/Icons/Icon";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { StructuredNotesResponse } from "../../../actions/aiNotes";
import { insertStructuredNotesAtCurrentSelection } from "../utils/structureSelection";

type SpeechToTextButtonPluginProps = {
	editorId?: string;
};

type VoiceNoteEventDetail = {
	targetEditorId?: string;
};

export default function SpeechToTextButtonPlugin({ editorId }: SpeechToTextButtonPluginProps) {
	const [editor] = useLexicalComposerContext();
	const [isSpeechAvailable, setIsSpeechAvailable] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [remainingSeconds, setRemainingSeconds] = useState<number>(DAILY_VOICE_LIMIT_SECONDS);
	const [isUsageLoading, setIsUsageLoading] = useState(true);
	const [liveRemainingSeconds, setLiveRemainingSeconds] = useState<number | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const audioChunksRef = useRef<BlobPart[]>([]);
	const recordingTimeoutRef = useRef<number | null>(null);
	const recordingStartedAtRef = useRef<number | null>(null);
	const recordingStartedWithRemainingRef = useRef<number>(DAILY_VOICE_LIMIT_SECONDS);
	const limitToastId = "daily-voice-limit-reached";

	useEffect(() => {
		if (typeof window === "undefined") return;
		setIsSpeechAvailable(typeof window.MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia));

		return () => {
			try {
				mediaRecorderRef.current?.stop();
			} catch {
				// no-op
			}
			mediaRecorderRef.current = null;
			mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
			mediaStreamRef.current = null;
			audioChunksRef.current = [];
			if (recordingTimeoutRef.current !== null) {
				window.clearTimeout(recordingTimeoutRef.current);
				recordingTimeoutRef.current = null;
			}
			recordingStartedAtRef.current = null;
			setLiveRemainingSeconds(null);
			setIsListening(false);
			setIsProcessing(false);
		};
	}, []);

	const loadVoiceUsage = useCallback(async () => {
		let resolvedRemaining = DAILY_VOICE_LIMIT_SECONDS;
		try {
			setIsUsageLoading(true);
			const response = await fetch("/api/ai/voice-usage", {
				method: "GET",
			});
			const payload = (await response.json()) as {
				success: boolean;
				remainingSeconds?: number;
				limitSeconds?: number;
				quotaEnabled?: boolean;
			};
			if (!payload.success) {
				resolvedRemaining = payload.remainingSeconds ?? 0;
				setRemainingSeconds(resolvedRemaining);
				return resolvedRemaining;
			}
			resolvedRemaining = payload.remainingSeconds ?? payload.limitSeconds ?? DAILY_VOICE_LIMIT_SECONDS;
			setRemainingSeconds(resolvedRemaining);
		} catch {
			resolvedRemaining = 0;
			setRemainingSeconds(resolvedRemaining);
		} finally {
			setIsUsageLoading(false);
		}
		return resolvedRemaining;
	}, []);

	useEffect(() => {
		void loadVoiceUsage();
	}, [loadVoiceUsage]);

	const processAudio = useCallback(async (audioBlob: Blob, durationSeconds?: number) => {
		setIsProcessing(true);
		const loadingToastId = toast.loading("Transcribing and structuring...");
		try {
			const file = new File([audioBlob], "speech.webm", { type: audioBlob.type || "audio/webm" });
			const formData = new FormData();
			formData.append("file", file);
			if (typeof durationSeconds === "number" && Number.isFinite(durationSeconds) && durationSeconds > 0) {
				formData.append("durationSeconds", String(Math.max(1, Math.ceil(durationSeconds))));
			}

			const response = await fetch("/api/ai/structure-speech", {
				method: "POST",
				body: formData,
			});

			const payload = (await response.json()) as {
				success: boolean;
				error?: string;
				data?: StructuredNotesResponse;
				remainingSeconds?: number;
				limitSeconds?: number;
				quotaEnabled?: boolean;
			};

			if (!payload.success || !payload.data) {
				toast.dismiss(loadingToastId);
				toast.error(payload.error ?? "Speech processing failed.");
				const serverQuotaEnabled = payload.quotaEnabled !== false;
				if (serverQuotaEnabled && typeof payload.remainingSeconds === "number") {
					setRemainingSeconds(payload.remainingSeconds);
				} else if (serverQuotaEnabled && typeof payload.limitSeconds === "number") {
					if (serverQuotaEnabled) {
						setRemainingSeconds(payload.limitSeconds);
					}
				}
				return;
			}

			insertStructuredNotesAtCurrentSelection(editor, payload.data);
			const serverQuotaEnabled = payload.quotaEnabled !== false;
			if (serverQuotaEnabled && typeof payload.remainingSeconds === "number") {
				setRemainingSeconds(payload.remainingSeconds);
			} else if (serverQuotaEnabled && typeof payload.limitSeconds === "number") {
				if (serverQuotaEnabled) {
					setRemainingSeconds(payload.limitSeconds);
				}
			}
			toast.dismiss(loadingToastId);
		} catch {
			toast.dismiss(loadingToastId);
			toast.error("Speech processing failed.");
		} finally {
			setIsProcessing(false);
		}
	}, [editor]);

	const stopSpeechToText = useCallback(() => {
		const recorder = mediaRecorderRef.current;
		mediaRecorderRef.current = null;
		if (recorder && recorder.state !== "inactive") {
			try {
				recorder.stop();
			} catch {
				// no-op
			}
		}
		mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
		mediaStreamRef.current = null;
		if (recordingTimeoutRef.current !== null) {
			window.clearTimeout(recordingTimeoutRef.current);
			recordingTimeoutRef.current = null;
		}
		setLiveRemainingSeconds(null);
		setIsListening(false);
	}, []);

	const startSpeechToText = useCallback(() => {
		if (isProcessing || isListening) return;

		void (async () => {
			try {
				const serverRemaining = await loadVoiceUsage();
				if (serverRemaining <= 0) {
					toast.info("You have 0:00 voice time left today.");
					return;
				}

				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				const recorder = new MediaRecorder(stream);
				audioChunksRef.current = [];
				mediaStreamRef.current = stream;
				mediaRecorderRef.current = recorder;

				recorder.ondataavailable = (event: BlobEvent) => {
					if (event.data.size > 0) {
						audioChunksRef.current.push(event.data);
					}
				};

				recorder.onstop = () => {
					const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
					audioChunksRef.current = [];
					const startedAt = recordingStartedAtRef.current;
					recordingStartedAtRef.current = null;
					const durationSeconds = startedAt ? Math.max(1, Math.ceil((Date.now() - startedAt) / 1000)) : undefined;
					if (durationSeconds) {
						const localRemaining = Math.max(0, recordingStartedWithRemainingRef.current - durationSeconds);
						setRemainingSeconds((prev) => Math.min(prev, localRemaining));
					}
					if (audioBlob.size > 0) {
						void processAudio(audioBlob, durationSeconds);
					}
				};

				recorder.start();
				recordingStartedAtRef.current = Date.now();
				recordingStartedWithRemainingRef.current = serverRemaining;
				setLiveRemainingSeconds(serverRemaining);
				setIsListening(true);
				if (serverRemaining > 0) {
					recordingTimeoutRef.current = window.setTimeout(() => {
						stopSpeechToText();
						toast.info("Daily voice limit reached for today.", { toastId: limitToastId });
					}, serverRemaining * 1000);
				}
			} catch {
				toast.error("Microphone access failed.");
				setIsListening(false);
			}
		})();
	}, [isListening, isProcessing, loadVoiceUsage, processAudio, stopSpeechToText]);

	const toggleSpeechToText = () => {
		if (isProcessing) return;
		if (isListening) {
			stopSpeechToText();
			return;
		}
		startSpeechToText();
	};

	useEffect(() => {
		if (!isListening) return;
		const intervalId = window.setInterval(() => {
			const startedAt = recordingStartedAtRef.current;
			if (!startedAt) return;
			const elapsedSeconds = Math.ceil((Date.now() - startedAt) / 1000);
			const next = Math.max(0, recordingStartedWithRemainingRef.current - elapsedSeconds);
			setLiveRemainingSeconds(next);
		}, 250);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [isListening]);

	useEffect(() => {
		if (!isListening) return;
		if ((liveRemainingSeconds ?? remainingSeconds) > 0) return;
		stopSpeechToText();
		toast.info("Daily voice limit reached for today.", { toastId: limitToastId });
	}, [isListening, liveRemainingSeconds, remainingSeconds, stopSpeechToText]);

	useEffect(() => {
		const handleStartVoiceCapture = (event: Event) => {
			const targetEditorId = (event as CustomEvent<VoiceNoteEventDetail>).detail?.targetEditorId;
			if (targetEditorId && targetEditorId !== editorId) return;
			startSpeechToText();
		};

		window.addEventListener("planner:start-ai-voice-note", handleStartVoiceCapture);
		return () => {
			window.removeEventListener("planner:start-ai-voice-note", handleStartVoiceCapture);
		};
	}, [editorId, startSpeechToText]);

	useEffect(() => {
		const handleStopVoiceCapture = (event: Event) => {
			const targetEditorId = (event as CustomEvent<VoiceNoteEventDetail>).detail?.targetEditorId;
			if (targetEditorId && targetEditorId !== editorId) return;
			if (!isListening) return;
			stopSpeechToText();
		};

		window.addEventListener("planner:stop-ai-voice-note", handleStopVoiceCapture);
		return () => {
			window.removeEventListener("planner:stop-ai-voice-note", handleStopVoiceCapture);
		};
	}, [editorId, isListening, stopSpeechToText]);

	if (!isSpeechAvailable) return null;
	const shownRemainingSeconds = liveRemainingSeconds ?? remainingSeconds;
	const voiceRemainingLabel = isUsageLoading
		? "Voice left today: ..."
		: `Voice left today: ${formatRemainingVoiceSeconds(shownRemainingSeconds)}`;

	return (
		<div
			className={styles["smart-editor__mic-shell"]}
			data-recording={isListening}
			data-processing={isProcessing}
		>
			<div className={styles["smart-editor__mic-usage"]} aria-live="polite">
				{voiceRemainingLabel}
			</div>
			<button
				type="button"
				className={styles["smart-editor__mic-button"]}
				data-recording={isListening}
				data-processing={isProcessing}
				onMouseDown={(event) => {
					event.preventDefault();
				}}
				onClick={toggleSpeechToText}
				disabled={isProcessing || isUsageLoading}
				aria-label={isListening ? "Stop dictation" : "Start AI voice notes"}
			>
				<Icon name="Microphone" size={24} />
			</button>
		</div>
	);
}
