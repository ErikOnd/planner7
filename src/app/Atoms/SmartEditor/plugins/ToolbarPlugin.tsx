"use client";

import styles from "../SmartEditor.module.scss";

import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { $createHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
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
import { useEffect, useState } from "react";

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
			<button
				type="button"
				className={`${styles["smart-editor__toolbar-btn"]} ${styles["smart-editor__toolbar-btn--spacer"]}`}
				onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
				disabled={!canUndo}
				aria-label="Undo"
			>
				<svg viewBox="0 0 20 20" className={styles["smart-editor__toolbar-icon"]} aria-hidden="true">
					<path d="M8.5 6.5H13.25C15.0449 6.5 16.5 7.95507 16.5 9.75C16.5 11.5449 15.0449 13 13.25 13H7.25" />
					<path d="M9.75 3.75L6.5 7L9.75 10.25" />
				</svg>
			</button>
			<button
				type="button"
				className={styles["smart-editor__toolbar-btn"]}
				onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
				disabled={!canRedo}
				aria-label="Redo"
			>
				<svg viewBox="0 0 20 20" className={styles["smart-editor__toolbar-icon"]} aria-hidden="true">
					<path d="M11.5 6.5H6.75C4.95508 6.5 3.5 7.95507 3.5 9.75C3.5 11.5449 4.95508 13 6.75 13H12.75" />
					<path d="M10.25 3.75L13.5 7L10.25 10.25" />
				</svg>
			</button>
		</div>
	);
}
