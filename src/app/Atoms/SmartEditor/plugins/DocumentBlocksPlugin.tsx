"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createParagraphNode,
	$getRoot,
	$getSelection,
	$insertNodes,
	$isRangeSelection,
	COMMAND_PRIORITY_EDITOR,
} from "lexical";
import { useEffect } from "react";
import { $createExcalidrawNode, INSERT_EXCALIDRAW_COMMAND } from "../nodes/ExcalidrawNode";
import { $createStickyNoteNode, INSERT_STICKY_NOTE_COMMAND } from "../nodes/StickyNoteNode";

export default function DocumentBlocksPlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const unregisterStickyNote = editor.registerCommand(
			INSERT_STICKY_NOTE_COMMAND,
			(payload) => {
				editor.update(() => {
					const stickyNoteNode = $createStickyNoteNode(payload);
					const root = $getRoot();
					root.append(stickyNoteNode);
				});
				return true;
			},
			COMMAND_PRIORITY_EDITOR,
		);

		const unregisterExcalidraw = editor.registerCommand(
			INSERT_EXCALIDRAW_COMMAND,
			(payload) => {
				editor.update(() => {
					const excalidrawNode = $createExcalidrawNode(payload);
					const paragraphNode = $createParagraphNode();
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						$insertNodes([excalidrawNode, paragraphNode]);
						paragraphNode.select();
						return;
					}
					const root = $getRoot();
					root.append(excalidrawNode, paragraphNode);
					paragraphNode.selectEnd();
				});
				return true;
			},
			COMMAND_PRIORITY_EDITOR,
		);

		return () => {
			unregisterStickyNote();
			unregisterExcalidraw();
		};
	}, [editor]);

	return null;
}
