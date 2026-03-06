"use client";

type CaptchaAction = "login" | "signup" | "recover" | "google";

type TurnstileRenderOptions = {
	sitekey: string;
	action?: string;
	size?: "normal" | "compact" | "invisible";
	execution?: "render" | "execute";
	callback: (token: string) => void;
	"error-callback"?: () => void;
	"expired-callback"?: () => void;
};

type TurnstileApi = {
	render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
	execute: (widgetId: string) => void;
	remove: (widgetId: string) => void;
};

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("CAPTCHA is only available in the browser."));
	}

	if (window.turnstile) {
		return Promise.resolve();
	}

	if (!turnstileScriptPromise) {
		turnstileScriptPromise = new Promise<void>((resolve, reject) => {
			const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
			if (existing) {
				existing.addEventListener("load", () => resolve(), { once: true });
				existing.addEventListener("error", () => reject(new Error("Failed to load CAPTCHA script.")), { once: true });
				return;
			}

			const script = document.createElement("script");
			script.src = TURNSTILE_SCRIPT_SRC;
			script.async = true;
			script.defer = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error("Failed to load CAPTCHA script."));
			document.head.appendChild(script);
		});
	}

	return turnstileScriptPromise;
}

export async function getAuthCaptchaToken(action: CaptchaAction): Promise<string | undefined> {
	const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
	if (!siteKey) {
		return undefined;
	}

	await loadTurnstileScript();
	const turnstile = window.turnstile;
	if (!turnstile) {
		throw new Error("CAPTCHA failed to initialize. Please try again.");
	}

	return await new Promise<string>((resolve, reject) => {
		const container = document.createElement("div");
		container.setAttribute("aria-hidden", "true");
		container.style.position = "absolute";
		container.style.width = "1px";
		container.style.height = "1px";
		container.style.overflow = "hidden";
		container.style.clipPath = "inset(50%)";
		container.style.whiteSpace = "nowrap";
		document.body.appendChild(container);

		let widgetId: string | null = null;
		const timeoutId = window.setTimeout(() => {
			cleanup();
			reject(new Error("CAPTCHA timed out. Please try again."));
		}, 15000);

		const cleanup = () => {
			window.clearTimeout(timeoutId);
			if (widgetId) {
				try {
					turnstile.remove(widgetId);
				} catch {
					// ignore cleanup failures
				}
			}
			container.remove();
		};

		try {
			widgetId = turnstile.render(container, {
				sitekey: siteKey,
				action,
				size: "invisible",
				execution: "execute",
				callback: (token: string) => {
					cleanup();
					resolve(token);
				},
				"error-callback": () => {
					cleanup();
					reject(new Error("CAPTCHA verification failed. Please try again."));
				},
				"expired-callback": () => {
					cleanup();
					reject(new Error("CAPTCHA expired. Please try again."));
				},
			});

			turnstile.execute(widgetId);
		} catch {
			cleanup();
			reject(new Error("CAPTCHA initialization failed. Please try again."));
		}
	});
}
