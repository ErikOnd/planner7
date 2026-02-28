"use client";

import styles from "./SmartEditor.module.scss";

import { useTheme } from "@/contexts/ThemeContext";
import { ImageLibraryDialog } from "@components/ImageLibraryDialog/ImageLibraryDialog";
import { useWeekDisplayPreference } from "@hooks/useWeekDisplayPreference";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { type InitialConfigType, LexicalComposer } from "@lexical/react/LexicalComposer";
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
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { NoteContent } from "types/noteContent";
import { ImageNode } from "./nodes/ImageNode";
import CodeHighlightingPlugin from "./plugins/CodeHighlightingPlugin";
import ImageUploadDropPlugin from "./plugins/ImageUploadDropPlugin";
import SlashCommandPlugin from "./plugins/SlashCommandPlugin";
import SpeechToTextButtonPlugin from "./plugins/SpeechToTextButtonPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { blockNoteToMarkdown, emptyState, hasNonEmptyRoot, isLexicalEditorState } from "./utils/content";
import { LINK_MATCHERS } from "./utils/linkMatchers";

type SmartEditorProps = {
	initialContent?: NoteContent;
	onChange?: (content: NoteContent) => void;
	ariaLabel?: string;
	editorId?: string;
};

export default function SmartEditor({ initialContent, onChange, ariaLabel, editorId }: SmartEditorProps) {
	const { mounted } = useTheme();
	const { showEditorToolbar } = useWeekDisplayPreference();
	const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [toolbarOffset, setToolbarOffset] = useState(0);
	const [activeImageUploads, setActiveImageUploads] = useState(0);
	const [imageUploadError, setImageUploadError] = useState<string | null>(null);
	const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
	const [showImageLimitNotice, setShowImageLimitNotice] = useState(false);
	const dragMenuRef = useRef<HTMLElement>(null);
	const dragTargetLineRef = useRef<HTMLElement>(null);
	const toolbarContainerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!showEditorToolbar) {
			setToolbarOffset(0);
			return;
		}

		const toolbarElement = toolbarContainerRef.current;
		if (!toolbarElement) return;

		const updateToolbarOffset = () => {
			setToolbarOffset(toolbarElement.getBoundingClientRect().height);
		};

		updateToolbarOffset();

		if (typeof ResizeObserver !== "undefined") {
			const observer = new ResizeObserver(updateToolbarOffset);
			observer.observe(toolbarElement);
			return () => observer.disconnect();
		}

		window.addEventListener("resize", updateToolbarOffset);
		return () => window.removeEventListener("resize", updateToolbarOffset);
	}, [showEditorToolbar]);

	const editorState = useMemo(() => {
		if (isLexicalEditorState(initialContent)) {
			return JSON.stringify(hasNonEmptyRoot(initialContent) ? initialContent : emptyState);
		}

		if (typeof initialContent === "string") {
			try {
				const parsed = JSON.parse(initialContent);
				if (isLexicalEditorState(parsed)) {
					return JSON.stringify(hasNonEmptyRoot(parsed) ? parsed : emptyState);
				}
			} catch {
				// Fall through and treat as plain text from older data.
			}

			return () => {
				const root = $getRoot();
				root.clear();
				const paragraph = $createParagraphNode();
				paragraph.append($createTextNode(initialContent));
				root.append(paragraph);
			};
		}

		const markdown = blockNoteToMarkdown(initialContent);
		return () => {
			const root = $getRoot();
			root.clear();
			if (!markdown) {
				root.append($createParagraphNode());
				return;
			}
			markdown.split("\n").forEach((line) => {
				const paragraph = $createParagraphNode();
				paragraph.append($createTextNode(line));
				root.append(paragraph);
			});
		};
	}, [initialContent]);

	const initialConfig = useMemo<InitialConfigType>(() => {
		return {
			namespace: "planner-smart-editor",
			theme: {
				paragraph: styles["smart-editor__paragraph"],
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
			},
			nodes: [
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
			],
			editorState,
			onError(error: Error) {
				console.error(error);
			},
		};
	}, [editorState]);

	if (typeof window === "undefined" || !mounted) return null;

	return (
		<div
			className={styles["smart-editor"]}
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
				<div ref={toolbarContainerRef}>
					{showEditorToolbar && <ToolbarPlugin />}
				</div>
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
				<RichTextPlugin
					contentEditable={
						<ContentEditable
							className={styles["smart-editor__contenteditable"]}
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
							className={styles["smart-editor__placeholder"]}
							style={{ top: `${toolbarOffset}px` }}
						>
							Start note taking, or type / for commands.
						</div>
					}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<HistoryPlugin />
				<CodeHighlightingPlugin />
				<TabIndentationPlugin />
				<LinkPlugin />
				<ClickableLinkPlugin />
				<AutoLinkPlugin matchers={LINK_MATCHERS} />
				<ListPlugin />
				<CheckListPlugin />
				<HorizontalRulePlugin />
				<MarkdownShortcutPlugin />
				{isFocused && <SlashCommandPlugin />}
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
				<SpeechToTextButtonPlugin editorId={editorId} />
				{isFocused && floatingAnchorElem && (
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
					onChange={(nextEditorState) => {
						const editorStateJSON = nextEditorState.toJSON();
						onChange?.(JSON.stringify(editorStateJSON));
					}}
				/>
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
