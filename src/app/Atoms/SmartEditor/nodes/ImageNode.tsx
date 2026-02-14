"use client";

import styles from "../SmartEditor.module.scss";

import { Icon } from "@atoms/Icons/Icon";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createParagraphNode,
	$getNodeByKey,
	$getRoot,
	createCommand,
	DecoratorNode,
	type LexicalCommand,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
} from "lexical";
import { useCallback, useEffect, useRef, useState, type JSX, type MouseEvent as ReactMouseEvent } from "react";

export type ImagePayload = {
	src: string;
	altText?: string;
	width?: number;
};

type SerializedImageNode = SerializedLexicalNode & {
	type: "image";
	version: 1;
	src: string;
	altText: string;
	width: number;
};

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand("INSERT_IMAGE_COMMAND");

export class ImageNode extends DecoratorNode<JSX.Element> {
	__src: string;
	__altText: string;
	__width: number;

	static getType(): string {
		return "image";
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(node.__src, node.__altText, node.__width, node.__key);
	}

	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		return new ImageNode(
			serializedNode.src,
			serializedNode.altText ?? "",
			serializedNode.width ?? 480,
		);
	}

	constructor(src: string, altText = "", width = 480, key?: NodeKey) {
		super(key);
		this.__src = src;
		this.__altText = altText;
		this.__width = width;
	}

	static importDOM(): null {
		return null;
	}

	exportJSON(): SerializedImageNode {
		return {
			...super.exportJSON(),
			type: "image",
			version: 1,
			src: this.__src,
			altText: this.__altText,
			width: this.__width,
		};
	}

	setWidth(width: number): void {
		const writable = this.getWritable();
		writable.__width = Math.max(120, Math.floor(width));
	}

	createDOM(): HTMLElement {
		const span = document.createElement("span");
		span.className = styles["smart-editor__image-node"];
		return span;
	}

	updateDOM(): false {
		return false;
	}

	decorate(): JSX.Element {
		return (
			<ResizableImage
				src={this.__src}
				altText={this.__altText}
				width={this.__width}
				nodeKey={this.__key}
			/>
		);
	}
}

export function $createImageNode(payload: ImagePayload): ImageNode {
	return new ImageNode(payload.src, payload.altText ?? "", payload.width ?? 480);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
	return node instanceof ImageNode;
}

function ResizableImage({
	src,
	altText,
	width,
	nodeKey,
}: {
	src: string;
	altText: string;
	width: number;
	nodeKey: NodeKey;
}) {
	const [editor] = useLexicalComposerContext();
	const wrapperRef = useRef<HTMLSpanElement | null>(null);
	const [draftWidth, setDraftWidth] = useState(width);
	const draftWidthRef = useRef(width);
	const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
	const [isSelected, setIsSelected] = useState(false);

	useEffect(() => {
		setDraftWidth(width);
		draftWidthRef.current = width;
	}, [width]);

	const removeSelectedImage = useCallback(() => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (!$isImageNode(node)) return;
			node.remove();
			const root = $getRoot();
			if (root.getChildrenSize() === 0) {
				const paragraph = $createParagraphNode();
				root.append(paragraph);
				paragraph.selectEnd();
			}
		});
		setIsSelected(false);
	}, [editor, nodeKey]);

	useEffect(() => {
		const handleDocumentMouseDown = (event: MouseEvent) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) return;
			if (!wrapperRef.current) return;
			if (wrapperRef.current.contains(target)) return;
			setIsSelected(false);
		};

		document.addEventListener("mousedown", handleDocumentMouseDown);
		return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
	}, []);

	useEffect(() => {
		if (!isSelected) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Backspace" && event.key !== "Delete") return;
			event.preventDefault();
			removeSelectedImage();
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isSelected, removeSelectedImage]);

	const onHandleMouseDown = (event: ReactMouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		dragStateRef.current = { startX: event.clientX, startWidth: draftWidth };

		const onMouseMove = (moveEvent: MouseEvent) => {
			const state = dragStateRef.current;
			if (!state) return;
			const deltaX = moveEvent.clientX - state.startX;
			const wrapperWidth = wrapperRef.current?.parentElement?.clientWidth ?? Number.MAX_SAFE_INTEGER;
			const nextWidth = Math.max(120, Math.min(state.startWidth + deltaX, wrapperWidth));
			draftWidthRef.current = nextWidth;
			setDraftWidth(nextWidth);
		};

		const onMouseUp = () => {
			const finalWidth = Math.max(120, Math.floor(draftWidthRef.current));
			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if ($isImageNode(node)) {
					node.setWidth(finalWidth);
				}
			});
			dragStateRef.current = null;
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
	};

	return (
		<span
			ref={wrapperRef}
			className={styles["smart-editor__image-wrapper"]}
			style={{ width: `${draftWidth}px` }}
			contentEditable={false}
			data-selected={isSelected}
			onClick={() => setIsSelected(true)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={src}
				alt={altText}
				className={styles["smart-editor__image"]}
				draggable={false}
				loading="lazy"
			/>
			<button
				type="button"
				className={styles["smart-editor__image-handle"]}
				onMouseDown={onHandleMouseDown}
				aria-label="Resize image"
			>
				<Icon name="arrow-down-right" size={14} className={styles["smart-editor__image-handle-icon"]} />
			</button>
			<button
				type="button"
				className={styles["smart-editor__image-delete"]}
				onClick={(event) => {
					event.preventDefault();
					event.stopPropagation();
					removeSelectedImage();
				}}
				aria-label="Remove image"
				title="Remove image"
			/>
		</span>
	);
}
