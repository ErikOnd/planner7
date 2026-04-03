"use client";

import styles from "./SmartEditor.module.scss";

import { ImageLibraryDialog } from "@components/ImageLibraryDialog/ImageLibraryDialog";
import { useMounted } from "@hooks/useMounted";
import { useWeekDisplayPreference } from "@hooks/useWeekDisplayPreference";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { type InitialConfigType, LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import clsx from "clsx";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { LexicalEditorStateJSON, NoteContent } from "types/noteContent";
import { ExcalidrawNode } from "./nodes/ExcalidrawNode";
import { ImageNode } from "./nodes/ImageNode";
import { StickyNoteNode } from "./nodes/StickyNoteNode";
import CodeBlockHeaderPlugin from "./plugins/CodeBlockHeaderPlugin";
import CodeHighlightingPlugin from "./plugins/CodeHighlightingPlugin";
import DocumentBlocksPlugin from "./plugins/DocumentBlocksPlugin";
import ImageUploadDropPlugin from "./plugins/ImageUploadDropPlugin";
import SlashCommandPlugin from "./plugins/SlashCommandPlugin";
import TableActionMenuPlugin from "./plugins/TableActionMenuPlugin";
import TableCellResizerPlugin from "./plugins/TableCellResizerPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import {
	blockNoteToMarkdown,
	emptyState,
	hasNonEmptyRoot,
	isLexicalEditorState,
	isLexicalEditorStateEffectivelyEmpty,
} from "./utils/content";
import { LINK_MATCHERS } from "./utils/linkMatchers";

type SmartEditorProps = {
	initialContent?: NoteContent;
	onChange?: (content: NoteContent) => void;
	ariaLabel?: string;
	variant?: "default" | "document";
	placeholder?: string;
};

const SMART_EDITOR_CODE_HIGHLIGHT_THEME = {
	atrule: styles["smart-editor__code-token--atrule"],
	attr: styles["smart-editor__code-token--attr"],
	boolean: styles["smart-editor__code-token--boolean"],
	builtin: styles["smart-editor__code-token--builtin"],
	cdata: styles["smart-editor__code-token--cdata"],
	char: styles["smart-editor__code-token--char"],
	class: styles["smart-editor__code-token--class"],
	"class-name": styles["smart-editor__code-token--class-name"],
	comment: styles["smart-editor__code-token--comment"],
	constant: styles["smart-editor__code-token--constant"],
	deleted: styles["smart-editor__code-token--deleted"],
	doctype: styles["smart-editor__code-token--doctype"],
	entity: styles["smart-editor__code-token--entity"],
	function: styles["smart-editor__code-token--function"],
	important: styles["smart-editor__code-token--important"],
	inserted: styles["smart-editor__code-token--inserted"],
	keyword: styles["smart-editor__code-token--keyword"],
	namespace: styles["smart-editor__code-token--namespace"],
	number: styles["smart-editor__code-token--number"],
	operator: styles["smart-editor__code-token--operator"],
	prolog: styles["smart-editor__code-token--prolog"],
	property: styles["smart-editor__code-token--property"],
	punctuation: styles["smart-editor__code-token--punctuation"],
	regex: styles["smart-editor__code-token--regex"],
	selector: styles["smart-editor__code-token--selector"],
	string: styles["smart-editor__code-token--string"],
	symbol: styles["smart-editor__code-token--symbol"],
	tag: styles["smart-editor__code-token--tag"],
	url: styles["smart-editor__code-token--url"],
	variable: styles["smart-editor__code-token--variable"],
} as const;

const SMART_EDITOR_THEME = {
	paragraph: styles["smart-editor__paragraph"],
	code: styles["smart-editor__code"],
	codeHighlight: SMART_EDITOR_CODE_HIGHLIGHT_THEME,
	heading: {
		h1: styles["smart-editor__h1"],
		h2: styles["smart-editor__h2"],
		h3: styles["smart-editor__h3"],
	},
	quote: styles["smart-editor__quote"],
	link: styles["smart-editor__link"],
	text: {
		bold: styles["smart-editor__text--bold"],
		italic: styles["smart-editor__text--italic"],
		underline: styles["smart-editor__text--underline"],
	},
	list: {
		checklist: styles["smart-editor__checklist"],
		ul: styles["smart-editor__ul"],
		ol: styles["smart-editor__ol"],
		listitem: styles["smart-editor__li"],
		nested: {
			listitem: styles["smart-editor__li-nested"],
		},
		listitemChecked: styles["smart-editor__li-checked"],
		listitemUnchecked: styles["smart-editor__li-unchecked"],
	},
	table: styles["smart-editor__table"],
	tableCell: styles["smart-editor__table-cell"],
	tableCellHeader: styles["smart-editor__table-cell-header"],
	tableCellSelected: styles["smart-editor__table-cell-selected"],
	tableRow: styles["smart-editor__table-row"],
	tableSelection: styles["smart-editor__table-selection"],
} as const;

const BASE_EDITOR_NODES = [
	HeadingNode,
	QuoteNode,
	ListNode,
	ListItemNode,
	HorizontalRuleNode,
	CodeNode,
	CodeHighlightNode,
	LinkNode,
	AutoLinkNode,
	ImageNode,
];

const DOCUMENT_EDITOR_NODES = [TableNode, TableRowNode, TableCellNode, StickyNoteNode, ExcalidrawNode];

function createParagraphNodeJSON(line: string) {
	return {
		children: line
			? [
				{
					detail: 0,
					format: 0,
					mode: "normal",
					style: "",
					text: line,
					type: "text",
					version: 1,
				},
			]
			: [],
		direction: null,
		format: "",
		indent: 0,
		textFormat: 0,
		textStyle: "",
		type: "paragraph",
		version: 1,
	};
}

function isNodeRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function stripIndentFromValue<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item) => stripIndentFromValue(item)) as T;
	}

	if (typeof value !== "object" || value === null) {
		return value;
	}

	return Object.fromEntries(
		Object.entries(value).map(([key, entryValue]) => {
			if (key === "indent") {
				return [key, 0];
			}

			return [key, stripIndentFromValue(entryValue)];
		}),
	) as T;
}

function ensureTrailingParagraphAfterCode(editorState: LexicalEditorStateJSON): LexicalEditorStateJSON {
	const rootChildren = Array.isArray(editorState.root.children) ? editorState.root.children : [];
	const lastChild = rootChildren[rootChildren.length - 1];

	if (!isNodeRecord(lastChild) || lastChild.type !== "code") {
		return editorState;
	}

	return {
		...editorState,
		root: {
			...editorState.root,
			children: [...rootChildren, createParagraphNodeJSON("")],
		},
	};
}

function normalizeDocumentEditorState(editorState: LexicalEditorStateJSON, stripIndent: boolean) {
	const normalizedEditorState = ensureTrailingParagraphAfterCode(editorState);
	return stripIndent ? stripIndentFromValue(normalizedEditorState) : normalizedEditorState;
}

function normalizeEditorStateForPersistence(editorState: unknown, stripIndent: boolean) {
	const normalizedEditorState = editorState as LexicalEditorStateJSON;
	return isLexicalEditorStateEffectivelyEmpty(normalizedEditorState)
		? emptyState
		: normalizeDocumentEditorState(normalizedEditorState, stripIndent);
}

function toLexicalStateJSON(initialContent?: NoteContent, stripIndent = false): LexicalEditorStateJSON {
	if (isLexicalEditorState(initialContent)) {
		const nextEditorState = hasNonEmptyRoot(initialContent) ? initialContent : emptyState;
		return normalizeDocumentEditorState(nextEditorState, stripIndent);
	}

	if (typeof initialContent === "string") {
		try {
			const parsed = JSON.parse(initialContent);
			if (isLexicalEditorState(parsed)) {
				const nextEditorState = hasNonEmptyRoot(parsed) ? parsed : emptyState;
				return normalizeDocumentEditorState(nextEditorState, stripIndent);
			}
		} catch {
			// treat as plain text
		}

		return normalizeDocumentEditorState(
			{
				root: {
					children: [createParagraphNodeJSON(initialContent)],
					direction: null,
					format: "",
					indent: 0,
					type: "root",
					version: 1,
				},
			},
			stripIndent,
		);
	}

	const markdown = blockNoteToMarkdown(initialContent);
	if (!markdown) {
		return normalizeDocumentEditorState(emptyState, stripIndent);
	}

	return normalizeDocumentEditorState(
		{
			root: {
				children: markdown.split("\n").map((line) => createParagraphNodeJSON(line)),
				direction: null,
				format: "",
				indent: 0,
				type: "root",
				version: 1,
			},
		},
		stripIndent,
	);
}

function EditorStateSyncPlugin({ serializedEditorState }: { serializedEditorState: string }) {
	const [editor] = useLexicalComposerContext();
	const previousSerializedEditorStateRef = useRef<string | null>(null);

	useEffect(() => {
		if (previousSerializedEditorStateRef.current === null) {
			previousSerializedEditorStateRef.current = serializedEditorState;
			return;
		}

		if (previousSerializedEditorStateRef.current === serializedEditorState) return;

		previousSerializedEditorStateRef.current = serializedEditorState;
		const currentState = JSON.stringify(editor.getEditorState().toJSON());
		if (currentState === serializedEditorState) return;

		editor.update(() => {
			const nextState = editor.parseEditorState(serializedEditorState);
			editor.setEditorState(nextState);
		}, { tag: "external-sync" });
	}, [editor, serializedEditorState]);

	return null;
}

export default function SmartEditor({
	initialContent,
	onChange,
	ariaLabel,
	variant = "default",
	placeholder = "Start writing, or type / for commands…",
}: SmartEditorProps) {
	const mounted = useMounted();
	const { showEditorToolbar } = useWeekDisplayPreference();
	const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [activeImageUploads, setActiveImageUploads] = useState(0);
	const [imageUploadError, setImageUploadError] = useState<string | null>(null);
	const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
	const [showImageLimitNotice, setShowImageLimitNotice] = useState(false);
	const dragMenuRef = useRef<HTMLElement>(null);
	const dragTargetLineRef = useRef<HTMLElement>(null);
	const isDocumentVariant = variant === "document";

	const serializedEditorState = useMemo(() => {
		return JSON.stringify(toLexicalStateJSON(initialContent, isDocumentVariant));
	}, [initialContent, isDocumentVariant]);
	const shouldShowToolbar = isDocumentVariant || showEditorToolbar;

	const initialConfig = useMemo<InitialConfigType>(() => {
		return {
			namespace: "planner-smart-editor",
			theme: SMART_EDITOR_THEME,
			nodes: [...BASE_EDITOR_NODES, ...(isDocumentVariant ? DOCUMENT_EDITOR_NODES : [])],
			editorState: serializedEditorState,
			onError(error: Error) {
				console.error(error);
			},
		};
	}, [serializedEditorState, isDocumentVariant]);

	if (typeof window === "undefined" || !mounted) {
		return null;
	}

	return (
		<div
			className={clsx(
				styles["smart-editor"],
				isDocumentVariant && styles["smart-editor--document"],
			)}
			ref={setFloatingAnchorElem}
			onFocusCapture={() => {
				setIsFocused(true);
			}}
			onBlurCapture={(event) => {
				const currentTarget = event.currentTarget;
				const nextTarget = event.relatedTarget as Node | null;
				if (nextTarget === null) return;
				if (currentTarget.contains(nextTarget)) return;
				setIsFocused(false);
			}}
		>
			<LexicalComposer initialConfig={initialConfig}>
				{shouldShowToolbar && !isDocumentVariant && <ToolbarPlugin />}
				{activeImageUploads > 0 && (
					<div className={styles["smart-editor__upload-status"]} role="status" aria-live="polite">
						Uploading image{activeImageUploads > 1 ? "s" : ""}...
					</div>
				)}
				{imageUploadError && (
					<div className={styles["smart-editor__upload-error"]} role="alert">
						{imageUploadError}
					</div>
				)}
				<div
					className={clsx(
						styles["smart-editor__content-area"],
						isDocumentVariant && styles["smart-editor__content-area--document"],
					)}
				>
					<RichTextPlugin
						contentEditable={
							<ContentEditable
								className={clsx(
									styles["smart-editor__contenteditable"],
									isDocumentVariant && styles["smart-editor__contenteditable--document"],
								)}
								aria-label={ariaLabel || "Text editor"}
								spellCheck={true}
								autoCorrect="on"
								autoCapitalize="sentences"
								data-gramm="false"
								data-gramm_editor="false"
								data-enable-grammarly="false"
							/>
						}
						placeholder={
							<div
								className={clsx(
									styles["smart-editor__placeholder"],
									isDocumentVariant && styles["smart-editor__placeholder--document"],
								)}
							>
								{placeholder}
							</div>
						}
						ErrorBoundary={LexicalErrorBoundary}
					/>
				</div>
				{shouldShowToolbar && isDocumentVariant && <ToolbarPlugin variant="floating" />}
				<HistoryPlugin />
				<CodeHighlightingPlugin />
				{floatingAnchorElem && <CodeBlockHeaderPlugin anchorElem={floatingAnchorElem} />}
				{!isDocumentVariant && <TabIndentationPlugin />}
				<LinkPlugin />
				<ClickableLinkPlugin />
				<AutoLinkPlugin matchers={LINK_MATCHERS} />
				<ListPlugin />
				<CheckListPlugin />
				<HorizontalRulePlugin />
				{isDocumentVariant && <TablePlugin hasHorizontalScroll={false} />}
				{isDocumentVariant && <TableCellResizerPlugin />}
				{isDocumentVariant && floatingAnchorElem && <TableActionMenuPlugin anchorElem={floatingAnchorElem} />}
				<MarkdownShortcutPlugin />
				{isFocused && <SlashCommandPlugin />}
				{isDocumentVariant && <DocumentBlocksPlugin />}
				<ImageUploadDropPlugin
					onUploadStart={(count) => {
						setImageUploadError(null);
						setActiveImageUploads((prev) => prev + count);
					}}
					onUploadEnd={(count) => {
						setActiveImageUploads((prev) => Math.max(0, prev - count));
					}}
					onUploadError={(message, errorCode) => {
						setImageUploadError(message);
						toast.error(message, { toastId: `image-upload-error:${message}` });
						if (errorCode === "storage_limit_exceeded") {
							setShowImageLimitNotice(true);
							setIsImageLibraryOpen(true);
						}
					}}
				/>
				{!isDocumentVariant && isFocused && floatingAnchorElem && (
					<DraggableBlockPlugin_EXPERIMENTAL
						anchorElem={floatingAnchorElem}
						menuRef={dragMenuRef as unknown as RefObject<HTMLElement>}
						targetLineRef={dragTargetLineRef as unknown as RefObject<HTMLElement>}
						menuComponent={
							<div
								ref={(element) => {
									dragMenuRef.current = element;
								}}
								className={styles["smart-editor__drag-menu"]}
								aria-hidden="true"
							>
								<span className={styles["smart-editor__drag-dots"]}>::::</span>
							</div>
						}
						targetLineComponent={
							<div
								ref={(element) => {
									dragTargetLineRef.current = element;
								}}
								className={styles["smart-editor__drag-line"]}
							/>
						}
						isOnMenu={(element: HTMLElement) => {
							return Boolean(element.closest(`.${styles["smart-editor__drag-menu"]}`));
						}}
					/>
				)}
				<OnChangePlugin
					ignoreSelectionChange={true}
					onChange={(nextEditorState, _editor, tags) => {
						if (tags.has("external-sync")) {
							return;
						}

						const normalizedEditorState = normalizeEditorStateForPersistence(
							nextEditorState.toJSON(),
							isDocumentVariant,
						);

						onChange?.(JSON.stringify(normalizedEditorState));
					}}
				/>
				<EditorStateSyncPlugin serializedEditorState={serializedEditorState} />
				<ImageLibraryDialog
					open={isImageLibraryOpen}
					onOpenChange={(open) => {
						setIsImageLibraryOpen(open);
						if (!open) {
							setShowImageLimitNotice(false);
						}
					}}
					showLimitNotice={showImageLimitNotice}
				/>
			</LexicalComposer>
		</div>
	);
}
