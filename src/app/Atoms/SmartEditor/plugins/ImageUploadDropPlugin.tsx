"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createParagraphNode,
	$getRoot,
	$getSelection,
	$insertNodes,
	$isRangeSelection,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_HIGH,
	COMMAND_PRIORITY_LOW,
	DRAGOVER_COMMAND,
	DROP_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { uploadImage } from "../../../../actions/upload-image";
import { $createImageNode, INSERT_IMAGE_COMMAND } from "../nodes/ImageNode";

export default function ImageUploadDropPlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const unregisterInsert = editor.registerCommand(
			INSERT_IMAGE_COMMAND,
			(payload) => {
				editor.update(() => {
					const imageNode = $createImageNode(payload);
					const paragraphNode = $createParagraphNode();
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						$insertNodes([imageNode, paragraphNode]);
						paragraphNode.select();
						return;
					}
					const root = $getRoot();
					root.append(imageNode, paragraphNode);
					paragraphNode.selectEnd();
				});
				return true;
			},
			COMMAND_PRIORITY_EDITOR,
		);

		const unregisterDragOver = editor.registerCommand(
			DRAGOVER_COMMAND,
			(event) => {
				const files = event.dataTransfer?.files;
				if (!files || files.length === 0) return false;

				const hasImage = Array.from(files).some((file) => file.type.startsWith("image/"));
				if (!hasImage) return false;

				event.preventDefault();
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);

		const unregisterDrop = editor.registerCommand(
			DROP_COMMAND,
			(event) => {
				const files = event.dataTransfer?.files;
				if (!files || files.length === 0) return false;

				const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
				if (imageFiles.length === 0) return false;

				event.preventDefault();

				void (async () => {
					for (const file of imageFiles) {
						const formData = new FormData();
						formData.append("file", file);
						const result = await uploadImage(formData);
						if (result.success) {
							editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
								src: result.url,
								altText: file.name,
							});
						} else {
							console.error("Image upload failed:", result.error);
						}
					}
				})();

				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);

		return () => {
			unregisterInsert();
			unregisterDragOver();
			unregisterDrop();
		};
	}, [editor]);

	return null;
}
