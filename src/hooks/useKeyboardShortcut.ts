import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

type KeyboardShortcutOptions = {
	key: string;
	callback: (event: KeyboardEvent) => void;
	preventDefault?: boolean;
	enabled?: boolean;
	disableInTextInputs?: boolean;
};

export function useKeyboardShortcut({
	key,
	callback,
	preventDefault = true,
	enabled = true,
	disableInTextInputs = true,
}: KeyboardShortcutOptions) {
	const callbackRef = useRef(callback);

	useLayoutEffect(() => {
		callbackRef.current = callback;
	});

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			const isTextInput = event.target instanceof HTMLTextAreaElement
				|| (event.target instanceof HTMLInputElement
					&& (!event.target.type || event.target.type === "text"))
				|| (event.target instanceof HTMLElement && event.target.isContentEditable);

			if (disableInTextInputs && isTextInput) {
				return;
			}

			const keyMatches = event.key.toLowerCase() === key.toLowerCase();
			const modifierPressed = event.ctrlKey || event.metaKey;

			if (keyMatches && modifierPressed) {
				if (preventDefault) {
					event.preventDefault();
				}
				callbackRef.current(event);
			}
		},
		[key, preventDefault, disableInTextInputs],
	);

	useEffect(() => {
		if (!enabled) return;

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown, enabled]);
}
