"use client";

import { Icon } from "@atoms/Icons/Icon";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import styles from "../SmartEditor.module.scss";

import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { $createHeadingNode } from "@lexical/rich-text";
import { $getSelectionStyleValueForProperty, $patchStyleText, $setBlocksType } from "@lexical/selection";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_LOW,
	type ElementFormatType,
	type ElementNode,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	type LexicalEditor,
	REDO_COMMAND,
	SELECTION_CHANGE_COMMAND,
	UNDO_COMMAND,
} from "lexical";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { INSERT_EXCALIDRAW_COMMAND } from "../nodes/ExcalidrawNode";
import { INSERT_STICKY_NOTE_COMMAND } from "../nodes/StickyNoteNode";
import { $createCodeNode } from "./CodeHighlightingPlugin";

const DEFAULT_HIGHLIGHT_COLOR = "#f8e71c";
const HIGHLIGHT_SWATCHES = ["#f8e71c", "#d9f36a", "#ffcf70", "#f9a8d4", "#93c5fd", "#c4b5fd", "#d4d4d4"];
const ALIGNMENT_OPTIONS: Array<{ value: Exclude<ElementFormatType, "">; label: string }> = [
	{ value: "left", label: "Left" },
	{ value: "center", label: "Center" },
	{ value: "right", label: "Right" },
	{ value: "justify", label: "Justify" },
];

type ToolbarPluginProps = {
	variant?: "default" | "floating";
};

type FloatingLayer = "highlight" | "align" | "insert";
type TrackedBlockType = "paragraph" | "h1" | "h2" | "code";

const MAX_TABLE_COLUMNS = 50;
const MAX_TABLE_ROWS = 500;
const TRACKED_BLOCK_TYPES = new Set<TrackedBlockType>(["paragraph", "h1", "h2", "code"]);
const BLOCK_BUTTONS: Array<{
	key: TrackedBlockType;
	label: string;
	ariaLabel: string;
	createNode: () => ElementNode;
	requiresAdvanced?: boolean;
}> = [
	{
		key: "paragraph",
		label: "P",
		ariaLabel: "Paragraph",
		createNode: () => $createParagraphNode(),
	},
	{
		key: "h1",
		label: "H1",
		ariaLabel: "Heading 1",
		createNode: () => $createHeadingNode("h1"),
	},
	{
		key: "h2",
		label: "H2",
		ariaLabel: "Heading 2",
		createNode: () => $createHeadingNode("h2"),
	},
	{
		key: "code",
		label: "Code",
		ariaLabel: "Code block",
		createNode: () => $createCodeNode(),
		requiresAdvanced: true,
	},
];

function isHexColor(value: string) {
	return /^#[\da-f]{6}$/i.test(value);
}

function isTrackedBlockType(value: string): value is TrackedBlockType {
	return TRACKED_BLOCK_TYPES.has(value as TrackedBlockType);
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

function useAnchoredLayer({
	isOpen,
	triggerRef,
	preferredWidth,
	preferredHeight,
}: {
	isOpen: boolean;
	triggerRef: RefObject<HTMLElement | null>;
	preferredWidth: number;
	preferredHeight: number;
}) {
	const layerRef = useRef<HTMLDivElement | null>(null);
	const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

	const updatePosition = useCallback(() => {
		if (typeof window === "undefined") return;

		const triggerRect = triggerRef.current?.getBoundingClientRect();
		if (!triggerRect) return;

		const layerRect = layerRef.current?.getBoundingClientRect();
		const viewportPadding = 12;
		const offset = 8;
		const layerWidth = layerRect?.width ?? preferredWidth;
		const layerHeight = layerRect?.height ?? preferredHeight;

		let left = triggerRect.left + (triggerRect.width / 2) - (layerWidth / 2);
		if (left + layerWidth > window.innerWidth - viewportPadding) {
			left = window.innerWidth - layerWidth - viewportPadding;
		}
		left = Math.max(viewportPadding, left);

		let top = triggerRect.bottom + offset;
		if (top + layerHeight > window.innerHeight - viewportPadding) {
			top = triggerRect.top - layerHeight - offset;
		}
		top = Math.max(viewportPadding, top);

		setPosition({ top, left });
	}, [preferredHeight, preferredWidth, triggerRef]);

	useEffect(() => {
		if (!isOpen) {
			setPosition(null);
			return;
		}

		updatePosition();
		const frame = window.requestAnimationFrame(updatePosition);

		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition, true);

		return () => {
			window.cancelAnimationFrame(frame);
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("scroll", updatePosition, true);
		};
	}, [isOpen, updatePosition]);

	return { layerRef, position };
}

function isValidTableDimension(value: string, maxValue: number) {
	const parsedValue = Number(value);
	return Number.isInteger(parsedValue) && parsedValue > 0 && parsedValue <= maxValue;
}

export default function ToolbarPlugin({ variant = "default" }: ToolbarPluginProps) {
	const [editor] = useLexicalComposerContext();
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [highlightColor, setHighlightColor] = useState("");
	const [customHighlightColor, setCustomHighlightColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
	const [blockType, setCurrentBlockType] = useState("paragraph");
	const [elementFormat, setElementFormat] = useState<ElementFormatType>("left");
	const [openLayer, setOpenLayer] = useState<FloatingLayer | null>(null);
	const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
	const [tableRows, setTableRows] = useState("5");
	const [tableColumns, setTableColumns] = useState("5");
	const highlightTriggerRef = useRef<HTMLButtonElement | null>(null);
	const alignTriggerRef = useRef<HTMLButtonElement | null>(null);
	const insertTriggerRef = useRef<HTMLButtonElement | null>(null);
	const customColorInputRef = useRef<HTMLInputElement | null>(null);
	const blockButtonRefs = useRef<Partial<Record<TrackedBlockType, HTMLButtonElement | null>>>({});
	const hasHighlight = highlightColor !== "";
	const isFloatingVariant = variant === "floating";
	const supportsAdvancedBlocks = isFloatingVariant;

	const { layerRef: highlightLayerRef, position: highlightLayerPosition } = useAnchoredLayer({
		isOpen: openLayer === "highlight",
		triggerRef: highlightTriggerRef,
		preferredWidth: 248,
		preferredHeight: 224,
	});
	const { layerRef: alignLayerRef, position: alignLayerPosition } = useAnchoredLayer({
		isOpen: openLayer === "align",
		triggerRef: alignTriggerRef,
		preferredWidth: 164,
		preferredHeight: 224,
	});
	const { layerRef: insertLayerRef, position: insertLayerPosition } = useAnchoredLayer({
		isOpen: openLayer === "insert",
		triggerRef: insertTriggerRef,
		preferredWidth: 224,
		preferredHeight: 260,
	});

	const currentAlignmentLabel = useMemo(() => {
		return ALIGNMENT_OPTIONS.find((option) => option.value === elementFormat)?.label ?? "Align";
	}, [elementFormat]);
	const canInsertTable = isValidTableDimension(tableRows, MAX_TABLE_ROWS)
		&& isValidTableDimension(tableColumns, MAX_TABLE_COLUMNS);

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

				const anchorNode = selection.anchor.getNode();
				const topLevelElement = anchorNode.getTopLevelElementOrThrow();
				if ("getTag" in topLevelElement && typeof topLevelElement.getTag === "function") {
					setCurrentBlockType(topLevelElement.getTag());
				} else {
					setCurrentBlockType(topLevelElement.getType());
				}
				setElementFormat(topLevelElement.getFormatType());
				return;
			}

			setIsBold(false);
			setIsItalic(false);
			setIsUnderline(false);
			setHighlightColor("");
			setCurrentBlockType("paragraph");
			setElementFormat("left");
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
		if (openLayer === null) return;

		const currentPanelRef = openLayer === "highlight"
			? highlightLayerRef
			: openLayer === "align"
			? alignLayerRef
			: insertLayerRef;
		const currentTriggerRef = openLayer === "highlight"
			? highlightTriggerRef
			: openLayer === "align"
			? alignTriggerRef
			: insertTriggerRef;

		const handlePointerDown = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (target && currentPanelRef.current?.contains(target)) return;
			if (target && currentTriggerRef.current?.contains(target)) return;
			setOpenLayer(null);
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpenLayer(null);
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [alignLayerRef, highlightLayerRef, insertLayerRef, openLayer]);

	useEffect(() => {
		if (!isFloatingVariant || !isTrackedBlockType(blockType)) return;

		const activeBlockButton = blockButtonRefs.current[blockType];
		if (!activeBlockButton) return;

		activeBlockButton.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
			inline: "center",
		});
	}, [blockType, isFloatingVariant]);

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
		setOpenLayer(null);
	};

	const applyElementFormat = (format: Exclude<ElementFormatType, "">) => {
		editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format);
		setElementFormat(format);
		setOpenLayer(null);
	};

	const openTableDialog = () => {
		setTableRows("5");
		setTableColumns("5");
		setOpenLayer(null);
		setIsTableDialogOpen(true);
	};

	const insertTable = () => {
		if (!canInsertTable) return;

		editor.dispatchCommand(INSERT_TABLE_COMMAND, {
			columns: tableColumns,
			rows: tableRows,
		});
		setIsTableDialogOpen(false);
	};

	const historyButtons = (
		<>
			<button
				type="button"
				className={clsx(
					styles["smart-editor__toolbar-btn"],
					!isFloatingVariant && styles["smart-editor__toolbar-btn--spacer"],
				)}
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
		<div
			className={clsx(
				styles["smart-editor__toolbar"],
				isFloatingVariant && styles["smart-editor__toolbar--floating"],
			)}
			role="toolbar"
			aria-label="Text formatting"
		>
			{isFloatingVariant ? historyButtons : null}
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
						setOpenLayer((currentValue) => (currentValue === "highlight" ? null : "highlight"));
					}}
					data-active={hasHighlight || openLayer === "highlight"}
					aria-label="Highlight color"
					aria-haspopup="dialog"
					aria-expanded={openLayer === "highlight"}
				>
					<span className={styles["smart-editor__highlight-trigger"]} aria-hidden="true">
						<Icon name="highlighter" size={18} className={styles["smart-editor__highlight-trigger-icon"]} />
						<Icon name="chevron-down" size={14} className={styles["smart-editor__highlight-trigger-chevron"]} />
					</span>
				</button>
			</div>
			{BLOCK_BUTTONS.map((blockButton) => {
				if (blockButton.requiresAdvanced && !supportsAdvancedBlocks) {
					return null;
				}

				return (
					<button
						key={blockButton.key}
						type="button"
						className={styles["smart-editor__toolbar-btn"]}
						ref={(element) => {
							blockButtonRefs.current[blockButton.key] = element;
						}}
						onClick={() => setBlockType(editor, blockButton.createNode)}
						data-active={blockType === blockButton.key}
						aria-label={blockButton.ariaLabel}
					>
						{blockButton.label}
					</button>
				);
			})}
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
			{supportsAdvancedBlocks
				? (
					<div className={styles["smart-editor__toolbar-item"]}>
						<button
							type="button"
							className={styles["smart-editor__toolbar-btn"]}
							ref={alignTriggerRef}
							onClick={() => {
								setOpenLayer((currentValue) => (currentValue === "align" ? null : "align"));
							}}
							data-active={openLayer === "align" || !["left", "start", ""].includes(elementFormat)}
							aria-label="Text alignment"
							aria-haspopup="menu"
							aria-expanded={openLayer === "align"}
						>
							{currentAlignmentLabel}
						</button>
					</div>
				)
				: null}
			{supportsAdvancedBlocks
				? (
					<div className={styles["smart-editor__toolbar-item"]}>
						<button
							type="button"
							className={styles["smart-editor__toolbar-btn"]}
							ref={insertTriggerRef}
							onClick={() => {
								setOpenLayer((currentValue) => (currentValue === "insert" ? null : "insert"));
							}}
							data-active={openLayer === "insert"}
							aria-label="Insert advanced block"
							aria-haspopup="menu"
							aria-expanded={openLayer === "insert"}
						>
							<span className={styles["smart-editor__insert-trigger"]}>
								<Icon name="plus" size={16} className={styles["smart-editor__toolbar-icon"]} />
								<Icon name="chevron-down" size={14} className={styles["smart-editor__highlight-trigger-chevron"]} />
							</span>
						</button>
					</div>
				)
				: null}
			{!isFloatingVariant ? historyButtons : null}
			{openLayer === "highlight" && typeof document !== "undefined"
				? createPortal(
					<div
						ref={highlightLayerRef}
						className={styles["smart-editor__highlight-picker"]}
						role="dialog"
						aria-label="Choose highlight color"
						style={highlightLayerPosition
							? { top: highlightLayerPosition.top, left: highlightLayerPosition.left }
							: { visibility: "hidden" }}
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
										setOpenLayer(null);
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
									setOpenLayer(null);
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
			{openLayer === "align" && typeof document !== "undefined"
				? createPortal(
					<div
						ref={alignLayerRef}
						className={styles["smart-editor__toolbar-popover"]}
						role="menu"
						aria-label="Text alignment"
						style={alignLayerPosition
							? { top: alignLayerPosition.top, left: alignLayerPosition.left }
							: { visibility: "hidden" }}
					>
						{ALIGNMENT_OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								className={styles["smart-editor__toolbar-popover-btn"]}
								data-active={elementFormat === option.value}
								onClick={() => applyElementFormat(option.value)}
								role="menuitem"
							>
								<span>{option.label}</span>
							</button>
						))}
					</div>,
					document.body,
				)
				: null}
			{openLayer === "insert" && typeof document !== "undefined"
				? createPortal(
					<div
						ref={insertLayerRef}
						className={styles["smart-editor__toolbar-popover"]}
						role="menu"
						aria-label="Insert block"
						style={insertLayerPosition
							? { top: insertLayerPosition.top, left: insertLayerPosition.left }
							: { visibility: "hidden" }}
					>
						<button
							type="button"
							className={styles["smart-editor__toolbar-popover-btn"]}
							onClick={() => {
								openTableDialog();
							}}
							role="menuitem"
						>
							<span>Table</span>
							<span className={styles["smart-editor__toolbar-popover-detail"]}>Choose rows and columns</span>
						</button>
						<button
							type="button"
							className={styles["smart-editor__toolbar-popover-btn"]}
							onClick={() => {
								editor.dispatchCommand(INSERT_STICKY_NOTE_COMMAND, undefined);
								setOpenLayer(null);
							}}
							role="menuitem"
						>
							<span>Sticky note</span>
							<span className={styles["smart-editor__toolbar-popover-detail"]}>Quick callout block</span>
						</button>
						<button
							type="button"
							className={styles["smart-editor__toolbar-popover-btn"]}
							onClick={() => {
								editor.dispatchCommand(INSERT_EXCALIDRAW_COMMAND, undefined);
								setOpenLayer(null);
							}}
							role="menuitem"
						>
							<span>Excalidraw</span>
							<span className={styles["smart-editor__toolbar-popover-detail"]}>Embed a sketch canvas</span>
						</button>
					</div>,
					document.body,
				)
				: null}
			<Dialog.Root open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
				<Dialog.Portal>
					<Dialog.Overlay className={styles["smart-editor__table-dialog-overlay"]} />
					<Dialog.Content className={styles["smart-editor__table-dialog"]}>
						<div className={styles["smart-editor__table-dialog-header"]}>
							<div>
								<Dialog.Title className={styles["smart-editor__table-dialog-title"]}>Insert Table</Dialog.Title>
							</div>
							<Dialog.Close asChild>
								<button
									type="button"
									className={styles["smart-editor__table-dialog-close"]}
									aria-label="Close insert table dialog"
								>
									<Icon name="close" size={20} className={styles["smart-editor__toolbar-icon"]} />
								</button>
							</Dialog.Close>
						</div>
						<div className={styles["smart-editor__table-dialog-divider"]} />
						<div className={styles["smart-editor__table-dialog-fields"]}>
							<label className={styles["smart-editor__table-dialog-field"]}>
								<span className={styles["smart-editor__table-dialog-label"]}>Rows</span>
								<input
									type="number"
									min={1}
									max={MAX_TABLE_ROWS}
									value={tableRows}
									onChange={(event) => setTableRows(event.target.value)}
									className={styles["smart-editor__table-dialog-input"]}
									autoFocus
								/>
							</label>
							<label className={styles["smart-editor__table-dialog-field"]}>
								<span className={styles["smart-editor__table-dialog-label"]}>Columns</span>
								<input
									type="number"
									min={1}
									max={MAX_TABLE_COLUMNS}
									value={tableColumns}
									onChange={(event) => setTableColumns(event.target.value)}
									className={styles["smart-editor__table-dialog-input"]}
								/>
							</label>
						</div>
						<div className={styles["smart-editor__table-dialog-actions"]}>
							<button
								type="button"
								className={styles["smart-editor__table-dialog-confirm"]}
								onClick={insertTable}
								disabled={!canInsertTable}
							>
								Confirm
							</button>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</div>
	);
}
