"use client";

import styles from "../SmartEditor.module.scss";

import { Icon } from "@atoms/Icons/Icon";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import {
	$createParagraphNode,
	$getNodeByKey,
	$getRoot,
	CLICK_COMMAND,
	COMMAND_PRIORITY_LOW,
	createCommand,
	DecoratorNode,
	isDOMNode,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	type LexicalCommand,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
} from "lexical";
import dynamic from "next/dynamic";
import { type CSSProperties, type JSX, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ExcalidrawCanvas = dynamic(
	async () => {
		const mod = await import("@excalidraw/excalidraw");
		return mod.Excalidraw;
	},
	{
		ssr: false,
		loading: () => <div className={styles["smart-editor__excalidraw-loading"]}>Loading canvas…</div>,
	},
);

type Dimension = number | "inherit";
type PersistedAppStateKey =
	| "exportBackground"
	| "exportScale"
	| "exportWithDarkMode"
	| "isBindingEnabled"
	| "isLoading"
	| "name"
	| "theme"
	| "viewBackgroundColor"
	| "viewModeEnabled"
	| "zenModeEnabled"
	| "zoom";

export type ExcalidrawSceneData = {
	elements: NonNullable<ExcalidrawInitialDataState["elements"]>;
	appState: NonNullable<ExcalidrawInitialDataState["appState"]>;
	files: NonNullable<BinaryFiles>;
};

export type ExcalidrawPayload = {
	scene?: ExcalidrawSceneData | null;
	width?: Dimension;
	height?: Dimension;
};

type SerializedExcalidrawNode = SerializedLexicalNode & {
	type: "excalidraw";
	version: 1;
	scene: ExcalidrawSceneData | null;
	width?: Dimension;
	height?: Dimension;
};

export const INSERT_EXCALIDRAW_COMMAND: LexicalCommand<ExcalidrawPayload | undefined> = createCommand(
	"INSERT_EXCALIDRAW_COMMAND",
);

const PERSISTED_APP_STATE_KEYS: PersistedAppStateKey[] = [
	"exportBackground",
	"exportScale",
	"exportWithDarkMode",
	"isBindingEnabled",
	"isLoading",
	"name",
	"theme",
	"viewBackgroundColor",
	"viewModeEnabled",
	"zenModeEnabled",
	"zoom",
];

const EMPTY_EXCALIDRAW_SCENE: ExcalidrawSceneData = {
	elements: [],
	appState: {
		viewBackgroundColor: "#ffffff",
	},
	files: {},
};

function normalizeAppState(appState: unknown): ExcalidrawSceneData["appState"] {
	const nextState: Partial<Record<PersistedAppStateKey, AppState[PersistedAppStateKey]>> = {
		viewBackgroundColor: "#ffffff",
	};

	if (appState && typeof appState === "object") {
		const sourceState = appState as Partial<Record<PersistedAppStateKey, AppState[PersistedAppStateKey]>>;
		for (const key of PERSISTED_APP_STATE_KEYS) {
			const value = sourceState[key];
			if (value !== undefined) {
				nextState[key] = value as AppState[typeof key];
			}
		}
	}

	return nextState as ExcalidrawSceneData["appState"];
}

function normalizeScene(scene: unknown): ExcalidrawSceneData {
	if (!scene || typeof scene !== "object") {
		return EMPTY_EXCALIDRAW_SCENE;
	}

	const nextScene = scene as Partial<ExcalidrawSceneData>;

	return {
		elements: Array.isArray(nextScene.elements) ? nextScene.elements : [],
		appState: normalizeAppState(nextScene.appState),
		files: nextScene.files && typeof nextScene.files === "object" ? nextScene.files : {},
	};
}

function cloneScene(scene: ExcalidrawSceneData | null | undefined): ExcalidrawSceneData {
	return normalizeScene(JSON.parse(JSON.stringify(scene ?? EMPTY_EXCALIDRAW_SCENE)));
}

function getVisibleElements(scene: ExcalidrawSceneData | null | undefined) {
	return (scene?.elements ?? []).filter((element) => element?.isDeleted !== true);
}

function hasSceneContent(scene: ExcalidrawSceneData | null | undefined) {
	return getVisibleElements(scene).length > 0 || Object.keys(scene?.files ?? {}).length > 0;
}

function removeStyleFromSvg(svg: SVGElement) {
	const styleTag = svg.firstElementChild?.firstElementChild;
	const viewBox = svg.getAttribute("viewBox");

	if (viewBox) {
		const [, , width, height] = viewBox.split(" ");
		if (width && height) {
			svg.setAttribute("width", width);
			svg.setAttribute("height", height);
		}
	}

	if (styleTag?.tagName === "style") {
		styleTag.remove();
	}
}

export class ExcalidrawNode extends DecoratorNode<JSX.Element> {
	__scene: ExcalidrawSceneData | null;
	__width: Dimension;
	__height: Dimension;

	static getType(): string {
		return "excalidraw";
	}

	static clone(node: ExcalidrawNode): ExcalidrawNode {
		return new ExcalidrawNode(node.__scene, node.__width, node.__height, node.__key);
	}

	static importJSON(serializedNode: SerializedExcalidrawNode): ExcalidrawNode {
		return new ExcalidrawNode(
			serializedNode.scene ?? null,
			serializedNode.width ?? "inherit",
			serializedNode.height ?? "inherit",
		);
	}

	constructor(
		scene: ExcalidrawSceneData | null = null,
		width: Dimension = "inherit",
		height: Dimension = "inherit",
		key?: NodeKey,
	) {
		super(key);
		this.__scene = scene === null ? null : normalizeScene(scene);
		this.__width = width;
		this.__height = height;
	}

	static importDOM(): null {
		return null;
	}

	exportJSON(): SerializedExcalidrawNode {
		return {
			...super.exportJSON(),
			type: "excalidraw",
			version: 1,
			scene: this.__scene,
			height: this.__height === "inherit" ? undefined : this.__height,
			width: this.__width === "inherit" ? undefined : this.__width,
		};
	}

	setScene(scene: ExcalidrawSceneData | null): void {
		const writable = this.getWritable();
		writable.__scene = scene === null ? null : normalizeScene(scene);
	}

	setWidth(width: Dimension): void {
		const writable = this.getWritable();
		writable.__width = width;
	}

	setHeight(height: Dimension): void {
		const writable = this.getWritable();
		writable.__height = height;
	}

	createDOM(): HTMLElement {
		const element = document.createElement("div");
		element.className = styles["smart-editor__excalidraw-node"];
		return element;
	}

	updateDOM(): false {
		return false;
	}

	decorate(): JSX.Element {
		return (
			<ExcalidrawBlock
				scene={this.__scene}
				width={this.__width}
				height={this.__height}
				nodeKey={this.__key}
			/>
		);
	}
}

export function $createExcalidrawNode(payload?: ExcalidrawPayload): ExcalidrawNode {
	return new ExcalidrawNode(payload?.scene ?? null, payload?.width ?? "inherit", payload?.height ?? "inherit");
}

export function $isExcalidrawNode(node: LexicalNode | null | undefined): node is ExcalidrawNode {
	return node instanceof ExcalidrawNode;
}

function ExcalidrawPreview({
	scene,
	width,
	height,
}: {
	scene: ExcalidrawSceneData;
	width: Dimension;
	height: Dimension;
}) {
	const [svgMarkup, setSvgMarkup] = useState("");

	useEffect(() => {
		let isActive = true;
		const visibleElements = getVisibleElements(scene);

		if (visibleElements.length === 0) {
			setSvgMarkup("");
			return () => {
				isActive = false;
			};
		}

		void import("@excalidraw/excalidraw")
			.then((mod) =>
				mod.exportToSvg({
					appState: scene.appState as never,
					elements: visibleElements as never,
					files: scene.files as never,
				})
			)
			.then((svg: SVGSVGElement) => {
				if (!isActive) {
					return;
				}

				removeStyleFromSvg(svg);
				svg.style.display = "block";
				svg.style.maxWidth = "100%";
				svg.style.height = height === "inherit" ? "auto" : "100%";
				svg.style.width = width === "inherit" ? "auto" : "100%";

				if (width !== "inherit") {
					svg.setAttribute("width", `${width}`);
				}

				if (height !== "inherit") {
					svg.setAttribute("height", `${height}`);
				}

				setSvgMarkup(svg.outerHTML);
			})
			.catch((error: unknown) => {
				console.error("Failed to render Excalidraw preview:", error);
				if (isActive) {
					setSvgMarkup("");
				}
			});

		return () => {
			isActive = false;
		};
	}, [height, scene, width]);

	const previewStyle: CSSProperties = {};

	if (width !== "inherit") {
		previewStyle.width = `${width}px`;
	}

	if (height !== "inherit") {
		previewStyle.height = `${height}px`;
	}

	return (
		<div
			className={styles["smart-editor__excalidraw-preview-surface"]}
			style={previewStyle}
			dangerouslySetInnerHTML={{ __html: svgMarkup }}
		/>
	);
}

function ExcalidrawModal({
	initialScene,
	onSave,
	onDiscard,
}: {
	initialScene: ExcalidrawSceneData;
	onSave: (scene: ExcalidrawSceneData) => void;
	onDiscard: () => void;
}) {
	const draftSceneRef = useRef<ExcalidrawSceneData>(cloneScene(initialScene));

	if (typeof document === "undefined") {
		return null;
	}

	return createPortal(
		<div className={styles["smart-editor__excalidraw-overlay"]} role="dialog" aria-modal="true">
			<div
				className={styles["smart-editor__excalidraw-dialog"]}
				onMouseDown={(event) => {
					event.stopPropagation();
				}}
			>
				<div className={styles["smart-editor__excalidraw-actions"]}>
					<button
						type="button"
						className={styles["smart-editor__excalidraw-action"]}
						onClick={onDiscard}
					>
						Discard
					</button>
					<button
						type="button"
						className={[
							styles["smart-editor__excalidraw-action"],
							styles["smart-editor__excalidraw-action--primary"],
						].join(" ")}
						onClick={() => {
							onSave(cloneScene(draftSceneRef.current));
						}}
					>
						Save
					</button>
				</div>
				<div className={styles["smart-editor__excalidraw-surface"]}>
					<ExcalidrawCanvas
						initialData={initialScene as ExcalidrawInitialDataState}
						onChange={(elements: unknown, appState: unknown, files: unknown) => {
							draftSceneRef.current = cloneScene({
								elements: elements as ExcalidrawElement[],
								appState: appState as ExcalidrawSceneData["appState"],
								files: files as BinaryFiles,
							});
						}}
					/>
				</div>
			</div>
		</div>,
		document.body,
	);
}

function ExcalidrawBlock({
	scene,
	width,
	height,
	nodeKey,
}: {
	scene: ExcalidrawSceneData | null;
	width: Dimension;
	height: Dimension;
	nodeKey: NodeKey;
}) {
	const [editor] = useLexicalComposerContext();
	const isEditable = useLexicalEditable();
	const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
	const [isModalOpen, setModalOpen] = useState(() => isEditable && !hasSceneContent(scene));
	const [modalInitialScene, setModalInitialScene] = useState<ExcalidrawSceneData>(() => cloneScene(scene));
	const buttonRef = useRef<HTMLButtonElement | null>(null);

	const removeNode = useCallback(() => {
		setModalOpen(false);
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (!$isExcalidrawNode(node)) {
				return;
			}

			node.remove();

			const root = $getRoot();
			if (root.getChildrenSize() === 0) {
				const paragraphNode = $createParagraphNode();
				root.append(paragraphNode);
				paragraphNode.selectEnd();
			}
		});
	}, [editor, nodeKey]);

	const persistScene = useCallback((nextScene: ExcalidrawSceneData) => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if ($isExcalidrawNode(node)) {
				node.setScene(nextScene);
			}
		});
	}, [editor, nodeKey]);

	const openModal = useCallback(() => {
		setModalInitialScene(cloneScene(scene));
		setModalOpen(true);
	}, [scene]);

	const discardChanges = useCallback(() => {
		setModalOpen(false);
		if (!hasSceneContent(scene)) {
			removeNode();
		}
	}, [removeNode, scene]);

	useEffect(() => {
		if (!isEditable && isSelected) {
			clearSelection();
		}
	}, [clearSelection, isEditable, isSelected]);

	useEffect(() => {
		if (!isEditable) {
			return undefined;
		}

		const unregisterClick = editor.registerCommand(
			CLICK_COMMAND,
			(event: MouseEvent) => {
				const buttonElement = buttonRef.current;
				const eventTarget = event.target;

				if (
					buttonElement !== null
					&& isDOMNode(eventTarget)
					&& buttonElement.contains(eventTarget)
				) {
					if (!event.shiftKey) {
						clearSelection();
					}
					setSelected(!isSelected);

					if (event.detail > 1) {
						openModal();
					}

					return true;
				}

				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
		const unregisterDelete = editor.registerCommand(
			KEY_DELETE_COMMAND,
			() => {
				if (!isSelected) {
					return false;
				}

				removeNode();
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);
		const unregisterBackspace = editor.registerCommand(
			KEY_BACKSPACE_COMMAND,
			() => {
				if (!isSelected) {
					return false;
				}

				removeNode();
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);

		return () => {
			unregisterClick();
			unregisterDelete();
			unregisterBackspace();
		};
	}, [clearSelection, editor, isEditable, isSelected, openModal, removeNode, setSelected]);

	useEffect(() => {
		if (!isModalOpen) {
			return undefined;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") {
				return;
			}

			event.preventDefault();
			discardChanges();
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [discardChanges, isModalOpen]);

	const hasPreview = hasSceneContent(scene);

	return (
		<>
			{isModalOpen
				? (
					<ExcalidrawModal
						initialScene={modalInitialScene}
						onSave={(nextScene) => {
							if (!hasSceneContent(nextScene)) {
								removeNode();
								return;
							}

							persistScene(nextScene);
							setModalOpen(false);
							clearSelection();
						}}
						onDiscard={discardChanges}
					/>
				)
				: null}
			{hasPreview
				? (
					<button
						ref={buttonRef}
						type="button"
						className={styles["smart-editor__excalidraw-button"]}
						contentEditable={false}
						data-selected={isSelected}
					>
						<ExcalidrawPreview scene={scene ?? EMPTY_EXCALIDRAW_SCENE} width={width} height={height} />
						{isSelected && isEditable
							? (
								<div
									className={styles["smart-editor__excalidraw-edit-button"]}
									role="button"
									tabIndex={-1}
									onMouseDown={(event) => {
										event.preventDefault();
									}}
									onClick={(event) => {
										event.preventDefault();
										event.stopPropagation();
										openModal();
									}}
								>
									<Icon name="pencil-line" size={16} />
								</div>
							)
							: null}
					</button>
				)
				: null}
		</>
	);
}
