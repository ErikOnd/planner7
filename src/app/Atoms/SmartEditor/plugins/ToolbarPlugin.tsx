"use client";

import { Icon } from "@atoms/Icons/Icon";
import styles from "../SmartEditor.module.scss";

import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { $createHeadingNode } from "@lexical/rich-text";
import { $getSelectionStyleValueForProperty, $patchStyleText, $setBlocksType } from "@lexical/selection";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_LOW,
	type ElementNode,
	FORMAT_TEXT_COMMAND,
	type LexicalEditor,
	REDO_COMMAND,
	SELECTION_CHANGE_COMMAND,
	UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DEFAULT_HIGHLIGHT_COLOR = "#f8e71c";
const HIGHLIGHT_SWATCHES = ["#f8e71c", "#d9f36a", "#ffcf70", "#f9a8d4", "#93c5fd", "#c4b5fd", "#d4d4d4"];

function isHexColor(value: string) {
	return /^#[\da-f]{6}$/i.test(value);
}

function patchHighlightStyle(color: string | null) {
	if (color === null) {
		return {
			"background-color": null,
			"border-radius": null,
			"box-decoration-break": null,
			"-webkit-box-decoration-break": null,
			"padding-inline": null,
		};
	}

	return {
		"background-color": color,
		"border-radius": "0.28rem",
		"box-decoration-break": "clone",
		"-webkit-box-decoration-break": "clone",
		"padding-inline": "0.08em",
	};
}

function setBlockType(editor: LexicalEditor, createNode: () => ElementNode) {
	editor.update(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			$setBlocksType(selection, createNode);
		}
	});
}

export default function ToolbarPlugin() {
	const [editor] = useLexicalComposerContext();
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [highlightColor, setHighlightColor] = useState("");
	const [customHighlightColor, setCustomHighlightColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
	const [isHighlightPickerOpen, setIsHighlightPickerOpen] = useState(false);
	const [highlightPickerPosition, setHighlightPickerPosition] = useState<{ top: number; left: number } | null>(null);
	const highlightTriggerRef = useRef<HTMLButtonElement | null>(null);
	const highlightPickerRef = useRef<HTMLDivElement | null>(null);
	const customColorInputRef = useRef<HTMLInputElement | null>(null);
	const hasHighlight = highlightColor !== "";

	const handleToggleLink = () => {
		const rawUrl = window.prompt("Enter URL (leave empty to remove link):", "https://");
		if (rawUrl === null) return;

		const trimmed = rawUrl.trim();
		if (trimmed === "") {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
			return;
		}

		const normalized = /^(https?:\/\/|mailto:|tel:)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
		editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalized);
	};

	useEffect(() => {
		const updateToolbar = () => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				setIsBold(selection.hasFormat("bold"));
				setIsItalic(selection.hasFormat("italic"));
				setIsUnderline(selection.hasFormat("underline"));
				const nextHighlightColor = $getSelectionStyleValueForProperty(selection, "background-color", "");
				setHighlightColor(nextHighlightColor);
				if (isHexColor(nextHighlightColor)) {
					setCustomHighlightColor(nextHighlightColor);
				}
			}
		};

		const unregisterUpdate = editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateToolbar();
			});
		});

		const unregisterSelection = editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				updateToolbar();
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);

		const unregisterCanUndo = editor.registerCommand(
			CAN_UNDO_COMMAND,
			(payload) => {
				setCanUndo(payload);
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);

		const unregisterCanRedo = editor.registerCommand(
			CAN_REDO_COMMAND,
			(payload) => {
				setCanRedo(payload);
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);

		return () => {
			unregisterUpdate();
			unregisterSelection();
			unregisterCanUndo();
			unregisterCanRedo();
		};
	}, [editor]);

	useEffect(() => {
		if (!isHighlightPickerOpen) return;

		const handlePointerDown = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (target && highlightPickerRef.current?.contains(target)) return;
			if (target && highlightTriggerRef.current?.contains(target)) return;
			setIsHighlightPickerOpen(false);
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsHighlightPickerOpen(false);
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isHighlightPickerOpen]);

	const updateHighlightPickerPosition = useCallback(() => {
		if (typeof window === "undefined") return;

		const triggerRect = highlightTriggerRef.current?.getBoundingClientRect();
		if (!triggerRect) return;

		const pickerRect = highlightPickerRef.current?.getBoundingClientRect();
		const viewportPadding = 12;
		const offset = 8;
		const pickerWidth = pickerRect?.width ?? 237;
		const pickerHeight = pickerRect?.height ?? 220;

		let left = triggerRect.left;
		if (left + pickerWidth > window.innerWidth - viewportPadding) {
			left = window.innerWidth - pickerWidth - viewportPadding;
		}
		left = Math.max(viewportPadding, left);

		let top = triggerRect.bottom + offset;
		if (top + pickerHeight > window.innerHeight - viewportPadding) {
			top = triggerRect.top - pickerHeight - offset;
		}
		top = Math.max(viewportPadding, top);

		setHighlightPickerPosition({ top, left });
	}, []);

	useEffect(() => {
		if (!isHighlightPickerOpen) {
			setHighlightPickerPosition(null);
			return;
		}

		updateHighlightPickerPosition();
		const frame = window.requestAnimationFrame(updateHighlightPickerPosition);

		window.addEventListener("resize", updateHighlightPickerPosition);
		window.addEventListener("scroll", updateHighlightPickerPosition, true);

		return () => {
			window.cancelAnimationFrame(frame);
			window.removeEventListener("resize", updateHighlightPickerPosition);
			window.removeEventListener("scroll", updateHighlightPickerPosition, true);
		};
	}, [isHighlightPickerOpen, updateHighlightPickerPosition]);

	const applyHighlightColor = (color: string) => {
		editor.update(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				$patchStyleText(selection, patchHighlightStyle(color));
			}
		});
		setCustomHighlightColor(color);
		setHighlightColor(color);
	};

	const clearHighlightColor = () => {
		editor.update(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				$patchStyleText(selection, patchHighlightStyle(null));
			}
		});
		setHighlightColor("");
		setIsHighlightPickerOpen(false);
	};

	const historyButtons = (
		<>
			<button
				type="button"
				className={`${styles["smart-editor__toolbar-btn"]} ${styles["smart-editor__toolbar-btn--spacer"]}`}
				onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
				disabled={!canUndo}
				aria-label="Undo"
			>
				<Icon name="undo" size={18} className={styles["smart-editor__toolbar-icon"]} />
			</button>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
				disabled={!canRedo}
				aria-label="Redo"
			>
				<Icon name="redo" size={18} className={styles["smart-editor__toolbar-icon"]} />
			</button>
		</>
	);

	return (
		<div className={styles["smart-editor__toolbar"]} role="toolbar" aria-label="Text formatting">
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
				data-active={isBold}
				aria-label="Bold"
			>
				B
			</button>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
				data-active={isItalic}
				aria-label="Italic"
			>
				I
			</button>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
				data-active={isUnderline}
				aria-label="Underline"
			>
				U
			</button>
			<div className={styles["smart-editor__toolbar-item"]}>
				<button
					type="button"
					className={styles["smart-editor__toolbar-btn"]}
					ref={highlightTriggerRef}
					onClick={() => {
						setIsHighlightPickerOpen((currentValue) => !currentValue);
					}}
					data-active={hasHighlight}
					aria-label="Highlight color"
					aria-haspopup="dialog"
					aria-expanded={isHighlightPickerOpen}
				>
					<span className={styles["smart-editor__highlight-trigger"]} aria-hidden="true">
						<Icon name="highlighter" size={18} className={styles["smart-editor__highlight-trigger-icon"]} />
						<Icon name="chevron-down" size={14} className={styles["smart-editor__highlight-trigger-chevron"]} />
					</span>
				</button>
			</div>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => setBlockType(editor, () => $createParagraphNode())}
				aria-label="Paragraph"
			>
				P
			</button>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => setBlockType(editor, () => $createHeadingNode("h1"))}
				aria-label="Heading 1"
			>
				H1
			</button>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => setBlockType(editor, () => $createHeadingNode("h2"))}
				aria-label="Heading 2"
			>
				H2
			</button>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
				aria-label="Bulleted list"
			>
				Bullets
			</button>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
				aria-label="Numbered list"
			>
				Numbers
			</button>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)}
				aria-label="Checklist"
			>
				Check
			</button>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}
				aria-label="Horizontal rule"
			>
				HR
			</button>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={handleToggleLink}
				aria-label="Insert link"
			>
				Link
			</button>
			{historyButtons}
			{isHighlightPickerOpen && typeof document !== "undefined"
				? createPortal(
						<div
							ref={highlightPickerRef}
							className={styles["smart-editor__highlight-picker"]}
							role="dialog"
							aria-label="Choose highlight color"
							style={
								highlightPickerPosition
									? { top: highlightPickerPosition.top, left: highlightPickerPosition.left }
									: { visibility: "hidden" }
							}
						>
							<div className={styles["smart-editor__highlight-grid"]}>
								{HIGHLIGHT_SWATCHES.map((swatchColor) => (
									<button
										key={swatchColor}
										type="button"
										className={styles["smart-editor__highlight-option"]}
										style={{ backgroundColor: swatchColor }}
										data-active={highlightColor.toLowerCase() === swatchColor.toLowerCase()}
										onClick={() => {
											applyHighlightColor(swatchColor);
											setIsHighlightPickerOpen(false);
										}}
										aria-label={`Use highlight color ${swatchColor}`}
									/>
								))}
							</div>
							<div className={styles["smart-editor__highlight-custom"]}>
								<span className={styles["smart-editor__highlight-label"]}>Custom</span>
								<div className={styles["smart-editor__highlight-custom-controls"]}>
									<button
										type="button"
										className={styles["smart-editor__highlight-color-trigger"]}
										onClick={() => {
											customColorInputRef.current?.click();
										}}
										aria-label="Open custom highlight color picker"
									>
										<span
											className={styles["smart-editor__highlight-color-preview"]}
											style={{ backgroundColor: customHighlightColor }}
											aria-hidden="true"
										/>
									</button>
									<input
										ref={customColorInputRef}
										type="color"
										value={customHighlightColor}
										className={styles["smart-editor__highlight-color-input"]}
										onChange={(event) => {
											const nextColor = event.target.value;
											setCustomHighlightColor(nextColor);
											applyHighlightColor(nextColor);
										}}
										aria-label="Choose custom highlight color"
										tabIndex={-1}
									/>
									<span className={styles["smart-editor__highlight-value"]}>{customHighlightColor.toUpperCase()}</span>
								</div>
							</div>
							<div className={styles["smart-editor__highlight-actions"]}>
								<button
									type="button"
									className={styles["smart-editor__highlight-action-btn"]}
									onClick={() => {
										applyHighlightColor(customHighlightColor);
										setIsHighlightPickerOpen(false);
									}}
								>
									Apply
								</button>
								<button
									type="button"
									className={styles["smart-editor__highlight-action-btn"]}
									onClick={clearHighlightColor}
								>
									Clear
								</button>
							</div>
						</div>,
						document.body,
					)
				: null}
		</div>
	);
}
