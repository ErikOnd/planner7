"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

declare global {
	interface Window {
		google?: {
			accounts: {
				id: {
					initialize: (config: {
						client_id: string;
						callback: (response: { credential?: string }) => void;
					}) => void;
					renderButton: (
						parent: HTMLElement,
						options: {
							type?: "standard" | "icon";
							theme?: "outline" | "filled_blue" | "filled_black";
							size?: "large" | "medium" | "small";
							text?: "signin_with" | "signup_with" | "continue_with" | "signin";
							shape?: "rectangular" | "pill" | "circle" | "square";
							logo_alignment?: "left" | "center";
							width?: number;
						},
					) => void;
				};
			};
		};
	}
}

let googleIdentityScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("Google sign-in is only available in the browser."));
	}

	if (window.google?.accounts?.id) {
		return Promise.resolve();
	}

	if (!googleIdentityScriptPromise) {
		googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
			const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`);
			if (existing) {
				existing.addEventListener("load", () => resolve(), { once: true });
				existing.addEventListener("error", () => reject(new Error("Failed to load Google sign-in script.")), {
					once: true,
				});
				return;
			}

			const script = document.createElement("script");
			script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
			script.async = true;
			script.defer = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error("Failed to load Google sign-in script."));
			document.head.appendChild(script);
		});
	}

	return googleIdentityScriptPromise;
}

type GoogleIdentityButtonProps = {
	onCredential: (idToken: string) => Promise<void>;
	onError: (message: string) => void;
	text?: "continue_with" | "signup_with" | "signin_with" | "signin";
	disabled?: boolean;
	children: (props: { onClick: () => void; disabled: boolean }) => ReactNode;
};

export function GoogleIdentityButton({
	onCredential,
	onError,
	text = "continue_with",
	disabled = false,
	children,
}: GoogleIdentityButtonProps) {
	const mountRef = useRef<HTMLDivElement | null>(null);
	const [trigger, setTrigger] = useState<(() => void) | null>(null);

	const triggerGoogleSignIn = useCallback(() => {
		if (disabled) return;
		if (!trigger) {
			onError("Google sign-in is not ready yet. Please try again.");
			return;
		}
		trigger();
	}, [disabled, onError, trigger]);

	useEffect(() => {
		if (disabled) {
			setTrigger(null);
			return;
		}

		const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
		if (!googleClientId) {
			onError("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID. Add it to your environment and restart the app.");
			return;
		}

		let cancelled = false;

		(async () => {
			try {
				await loadGoogleIdentityScript();
				if (cancelled || !mountRef.current) return;

				const googleIdentity = window.google?.accounts?.id;
				if (!googleIdentity) {
					onError("Google sign-in is unavailable.");
					return;
				}

				googleIdentity.initialize({
					client_id: googleClientId,
					callback: async ({ credential }) => {
						if (!credential) {
							onError("Google sign-in failed. Missing identity token.");
							return;
						}
						await onCredential(credential);
					},
				});

				mountRef.current.innerHTML = "";
				const containerWidth = Math.max(220, Math.floor(mountRef.current.getBoundingClientRect().width || 320));
				googleIdentity.renderButton(mountRef.current, {
					type: "standard",
					theme: "outline",
					size: "large",
					text,
					shape: "rectangular",
					logo_alignment: "left",
					width: containerWidth,
				});
				const el = mountRef.current.querySelector<HTMLElement>("[role='button'], div[tabindex='0']");
				if (el) {
					setTrigger(() => () => {
						el.click();
					});
				} else {
					setTrigger(null);
				}
			} catch (err) {
				onError(err instanceof Error ? err.message : "Failed to initialize Google sign-in.");
			}
		})();

		return () => {
			cancelled = true;
			setTrigger(null);
		};
	}, [disabled, onCredential, onError, text]);

	return (
		<>
			{children({ onClick: triggerGoogleSignIn, disabled })}
			<div
				ref={mountRef}
				aria-hidden="true"
				style={{
					position: "absolute",
					width: 1,
					height: 1,
					overflow: "hidden",
					clipPath: "inset(50%)",
					whiteSpace: "nowrap",
				}}
			/>
		</>
	);
}
