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
	PASTE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { uploadImage } from "../../../../actions/upload-image";
import { $createImageNode, INSERT_IMAGE_COMMAND } from "../nodes/ImageNode";

type ImageUploadDropPluginProps = {
	onUploadError?: (message: string, errorCode?: "storage_limit_exceeded" | "upload_failed") => void;
	onUploadStart?: (count: number) => void;
	onUploadEnd?: (count: number) => void;
};

export default function ImageUploadDropPlugin(
	{ onUploadError, onUploadStart, onUploadEnd }: ImageUploadDropPluginProps,
) {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const uploadAndInsertImages = async (files: File[]) => {
			if (files.length === 0) return;
			onUploadStart?.(files.length);
			try {
				for (const file of files) {
					try {
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
							onUploadError?.(result.error, result.errorCode);
						}
					} catch (error) {
						console.error("Image upload action crashed:", error);
						onUploadError?.(error instanceof Error ? error.message : "Image upload failed", "upload_failed");
					}
				}
			} finally {
				onUploadEnd?.(files.length);
			}
		};

		const handleImageFiles = (files: FileList | null | undefined, preventDefault: () => void) => {
			if (!files || files.length === 0) return false;

			const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
			if (imageFiles.length === 0) return false;

			preventDefault();
			void uploadAndInsertImages(imageFiles);
			return true;
		};

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
				return handleImageFiles(event.dataTransfer?.files, () => event.preventDefault());
			},
			COMMAND_PRIORITY_HIGH,
		);

		const unregisterPaste = editor.registerCommand(
			PASTE_COMMAND,
			(event) => {
				if (!(event instanceof ClipboardEvent)) return false;
				return handleImageFiles(event.clipboardData?.files, () => event.preventDefault());
			},
			COMMAND_PRIORITY_HIGH,
		);

		return () => {
			unregisterInsert();
			unregisterDragOver();
			unregisterDrop();
			unregisterPaste();
		};
	}, [editor, onUploadEnd, onUploadError, onUploadStart]);

	return null;
}
