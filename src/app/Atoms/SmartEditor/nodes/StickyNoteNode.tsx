"use client";

import styles from "../SmartEditor.module.scss";

import { Icon } from "@atoms/Icons/Icon";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import {
	$createParagraphNode,
	$getNodeByKey,
	$getRoot,
	$setSelection,
	createCommand,
	createEditor,
	DecoratorNode,
	type LexicalCommand,
	type LexicalEditor,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
} from "lexical";
import { type JSX, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { LexicalEditorStateJSON } from "types/noteContent";

type StickyNoteColor = "pink" | "yellow";

export type StickyNotePayload = {
	xOffset?: number;
	yOffset?: number;
};

type SerializedStickyNoteNode = SerializedLexicalNode & {
	type: "sticky-note";
	version: 1;
	xOffset: number;
	yOffset: number;
	color: StickyNoteColor;
	caption: LexicalEditorStateJSON;
};

type StickyNotePositioning = {
	isDragging: boolean;
	offsetX: number;
	offsetY: number;
	rootRect: DOMRect | null;
	x: number;
	y: number;
};

const EMPTY_STICKY_CAPTION_STATE: LexicalEditorStateJSON = {
	root: {
		children: [
			{
				children: [],
				direction: null,
				format: "",
				indent: 0,
				type: "paragraph",
				version: 1,
				textFormat: 0,
				textStyle: "",
			},
		],
		direction: null,
		format: "",
		indent: 0,
		type: "root",
		version: 1,
	},
};

function normalizeStickyCaptionState(editorState?: LexicalEditorStateJSON): LexicalEditorStateJSON {
	if (!editorState || !Array.isArray(editorState.root.children) || editorState.root.children.length === 0) {
		return EMPTY_STICKY_CAPTION_STATE;
	}

	return editorState;
}

export const INSERT_STICKY_NOTE_COMMAND: LexicalCommand<StickyNotePayload | undefined> = createCommand(
	"INSERT_STICKY_NOTE_COMMAND",
);

function createStickyCaptionEditor(initialState = EMPTY_STICKY_CAPTION_STATE) {
	const editor = createEditor({
		namespace: "planner7-sticky-note",
		theme: {
			paragraph: styles["smart-editor__sticky-note-paragraph"],
		},
		onError(error: Error) {
			console.error(error);
		},
	});

	editor.setEditorState(editor.parseEditorState(JSON.stringify(normalizeStickyCaptionState(initialState))));
	return editor;
}

function positionStickyNote(stickyElement: HTMLElement, positioning: StickyNotePositioning) {
	const rootRect = positioning.rootRect;
	const left = (rootRect?.left ?? 0) + positioning.x;
	const top = (rootRect?.top ?? 0) + positioning.y;
	stickyElement.style.left = `${left}px`;
	stickyElement.style.top = `${top}px`;
}

export class StickyNoteNode extends DecoratorNode<JSX.Element> {
	__x: number;
	__y: number;
	__color: StickyNoteColor;
	__caption: LexicalEditor;
	__captionState: LexicalEditorStateJSON;

	static getType(): string {
		return "sticky-note";
	}

	static clone(node: StickyNoteNode): StickyNoteNode {
		return new StickyNoteNode(node.__x, node.__y, node.__color, node.__caption, node.__captionState, node.__key);
	}

	static importJSON(serializedNode: SerializedStickyNoteNode): StickyNoteNode {
		return new StickyNoteNode(
			serializedNode.xOffset ?? 0,
			serializedNode.yOffset ?? 0,
			serializedNode.color ?? "pink",
			undefined,
			serializedNode.caption ?? EMPTY_STICKY_CAPTION_STATE,
		);
	}

	constructor(
		xOffset = 0,
		yOffset = 0,
		color: StickyNoteColor = "pink",
		caption?: LexicalEditor,
		captionState: LexicalEditorStateJSON = EMPTY_STICKY_CAPTION_STATE,
		key?: NodeKey,
	) {
		super(key);
		const normalizedCaptionState = normalizeStickyCaptionState(captionState);
		this.__x = xOffset;
		this.__y = yOffset;
		this.__color = color;
		this.__caption = caption ?? createStickyCaptionEditor(normalizedCaptionState);
		this.__captionState = normalizedCaptionState;
	}

	static importDOM(): null {
		return null;
	}

	exportJSON(): SerializedStickyNoteNode {
		return {
			...super.exportJSON(),
			type: "sticky-note",
			version: 1,
			xOffset: this.__x,
			yOffset: this.__y,
			color: this.__color,
			caption: this.__captionState,
		};
	}

	setPosition(xOffset: number, yOffset: number): this {
		const writable = this.getWritable();
		writable.__x = xOffset;
		writable.__y = yOffset;
		$setSelection(null);
		return writable;
	}

	toggleColor(): this {
		const writable = this.getWritable();
		writable.__color = writable.__color === "pink" ? "yellow" : "pink";
		return writable;
	}

	setCaption(editorState: LexicalEditorStateJSON): this {
		const writable = this.getWritable();
		writable.__captionState = normalizeStickyCaptionState(editorState);
		return writable;
	}

	createDOM(): HTMLElement {
		const element = document.createElement("div");
		element.className = styles["smart-editor__sticky-note-node"];
		element.style.display = "contents";
		return element;
	}

	updateDOM(): false {
		return false;
	}

	decorate(): JSX.Element {
		return createPortal(
			<StickyNoteBlock
				xOffset={this.__x}
				yOffset={this.__y}
				color={this.__color}
				nodeKey={this.__key}
				caption={this.__caption}
			/>,
			document.body,
		);
	}

	isIsolated(): true {
		return true;
	}
}

export function $createStickyNoteNode(payload?: StickyNotePayload): StickyNoteNode {
	return new StickyNoteNode(payload?.xOffset ?? 0, payload?.yOffset ?? 0, "pink");
}

export function $isStickyNoteNode(node: LexicalNode | null | undefined): node is StickyNoteNode {
	return node instanceof StickyNoteNode;
}

function StickyNoteBlock({
	xOffset,
	yOffset,
	color,
	nodeKey,
	caption,
}: {
	xOffset: number;
	yOffset: number;
	color: StickyNoteColor;
	nodeKey: NodeKey;
	caption: LexicalEditor;
}) {
	const [editor] = useLexicalComposerContext();
	const stickyContainerRef = useRef<HTMLDivElement | null>(null);
	const stickySurfaceRef = useRef<HTMLDivElement | null>(null);
	const positioningRef = useRef<StickyNotePositioning>({
		isDragging: false,
		offsetX: 0,
		offsetY: 0,
		rootRect: null,
		x: xOffset,
		y: yOffset,
	});

	const syncStickyPosition = useCallback(() => {
		const stickyElement = stickyContainerRef.current;
		if (!stickyElement) return;
		positionStickyNote(stickyElement, positioningRef.current);
	}, []);

	useEffect(() => {
		const positioning = positioningRef.current;
		positioning.x = xOffset;
		positioning.y = yOffset;
		syncStickyPosition();
	}, [syncStickyPosition, xOffset, yOffset]);

	useLayoutEffect(() => {
		const updateRootRect = () => {
			const rootElement = editor.getRootElement();
			positioningRef.current.rootRect = rootElement?.getBoundingClientRect() ?? null;
			syncStickyPosition();
		};

		updateRootRect();

		const resizeObserver = new ResizeObserver(() => {
			updateRootRect();
		});

		const unregisterRoot = editor.registerRootListener((rootElement) => {
			if (!rootElement) {
				positioningRef.current.rootRect = null;
				return undefined;
			}

			resizeObserver.observe(rootElement);
			updateRootRect();

			return () => {
				resizeObserver.unobserve(rootElement);
			};
		});

		window.addEventListener("resize", updateRootRect);
		window.addEventListener("scroll", updateRootRect, true);

		return () => {
			unregisterRoot();
			resizeObserver.disconnect();
			window.removeEventListener("resize", updateRootRect);
			window.removeEventListener("scroll", updateRootRect, true);
		};
	}, [editor, syncStickyPosition]);

	useEffect(() => {
		const stickyContainer = stickyContainerRef.current;
		if (!stickyContainer) return;

		const timeoutId = window.setTimeout(() => {
			stickyContainer.style.setProperty("transition", "top 0.22s ease, left 0.22s ease");
		}, 200);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, []);

	const handlePointerMove = useCallback((event: PointerEvent) => {
		const stickyContainer = stickyContainerRef.current;
		const positioning = positioningRef.current;
		if (!stickyContainer || !positioning.isDragging || !positioning.rootRect) return;

		positioning.x = event.clientX - positioning.offsetX - positioning.rootRect.left;
		positioning.y = event.clientY - positioning.offsetY - positioning.rootRect.top;
		positionStickyNote(stickyContainer, positioning);
	}, []);

	const handlePointerUp = useCallback(function handleStickyPointerUp() {
		const stickyContainer = stickyContainerRef.current;
		const positioning = positioningRef.current;
		positioning.isDragging = false;
		stickyContainer?.classList.remove(styles["smart-editor__sticky-note-container--dragging"]);

		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if ($isStickyNoteNode(node)) {
				node.setPosition(positioning.x, positioning.y);
			}
		});

		document.removeEventListener("pointermove", handlePointerMove);
		document.removeEventListener("pointerup", handleStickyPointerUp);
	}, [editor, handlePointerMove, nodeKey]);

	useEffect(() => {
		return () => {
			document.removeEventListener("pointermove", handlePointerMove);
			document.removeEventListener("pointerup", handlePointerUp);
		};
	}, [handlePointerMove, handlePointerUp]);

	const removeNode = () => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (!$isStickyNoteNode(node)) return;

			node.remove();

			const root = $getRoot();
			if (root.getChildrenSize() === 0) {
				const paragraphNode = $createParagraphNode();
				root.append(paragraphNode);
				paragraphNode.selectEnd();
			}
		});
	};

	const toggleColor = () => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if ($isStickyNoteNode(node)) {
				node.toggleColor();
			}
		});
	};

	return (
		<div ref={stickyContainerRef} className={styles["smart-editor__sticky-note-container"]}>
			<div
				ref={stickySurfaceRef}
				className={[
					styles["smart-editor__sticky-note-surface"],
					color === "yellow"
						? styles["smart-editor__sticky-note-surface--yellow"]
						: styles["smart-editor__sticky-note-surface--pink"],
				].join(" ")}
				onPointerDown={(event) => {
					if (event.button === 2 || event.target !== stickySurfaceRef.current) {
						return;
					}

					const stickySurface = stickySurfaceRef.current;
					const positioning = positioningRef.current;
					if (!stickySurface) return;

					const stickyRect = stickySurface.getBoundingClientRect();
					positioning.offsetX = event.clientX - stickyRect.left;
					positioning.offsetY = event.clientY - stickyRect.top;
					positioning.isDragging = true;
					stickyContainerRef.current?.classList.add(styles["smart-editor__sticky-note-container--dragging"]);

					document.addEventListener("pointermove", handlePointerMove);
					document.addEventListener("pointerup", handlePointerUp);
					event.preventDefault();
				}}
			>
				<button
					type="button"
					className={styles["smart-editor__sticky-note-control"]}
					onClick={toggleColor}
					aria-label="Change sticky note color"
					title="Change sticky note color"
				>
					<Icon name="highlighter" size={14} className={styles["smart-editor__sticky-note-control-icon"]} />
				</button>
				<button
					type="button"
					className={styles["smart-editor__sticky-note-delete"]}
					onClick={removeNode}
					aria-label="Delete sticky note"
					title="Delete sticky note"
				>
					<Icon name="close" size={12} className={styles["smart-editor__sticky-note-control-icon"]} />
				</button>
				<LexicalNestedComposer initialEditor={caption}>
					<PlainTextPlugin
						contentEditable={<ContentEditable className={styles["smart-editor__sticky-note-content"]} />}
						placeholder={<div className={styles["smart-editor__sticky-note-placeholder"]}>What&apos;s up?</div>}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<HistoryPlugin />
					<OnChangePlugin
						onChange={(editorState) => {
							editor.update(() => {
								const node = $getNodeByKey(nodeKey);
								if ($isStickyNoteNode(node)) {
									node.setCaption(editorState.toJSON() as LexicalEditorStateJSON);
								}
							});
						}}
					/>
				</LexicalNestedComposer>
			</div>
		</div>
	);
}
