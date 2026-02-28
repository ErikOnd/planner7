"use client";

import smartEditorStyles from "@atoms/SmartEditor/SmartEditor.module.scss";
import { createStructuredNodes } from "@atoms/SmartEditor/utils/structureSelection";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { type InitialConfigType, LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { useMemo } from "react";
import type { StructuredNotesResponse } from "../../actions/aiNotes";
import landingStyles from "./LandingPage.module.scss";

type LexicalPreviewProps = {
	plainLines?: string[];
	structuredData?: StructuredNotesResponse;
};

export function LexicalPreview({ plainLines, structuredData }: LexicalPreviewProps) {
	const initialConfig = useMemo<InitialConfigType>(() => {
		return {
			namespace: "planner7-landing-preview",
			editable: false,
			theme: {
				paragraph: smartEditorStyles["smart-editor__paragraph"],
				heading: {
					h1: smartEditorStyles["smart-editor__h1"],
					h2: smartEditorStyles["smart-editor__h2"],
					h3: smartEditorStyles["smart-editor__h3"],
				},
				quote: smartEditorStyles["smart-editor__quote"],
				link: smartEditorStyles["smart-editor__link"],
				text: {
					bold: smartEditorStyles["smart-editor__text--bold"],
					italic: smartEditorStyles["smart-editor__text--italic"],
					underline: smartEditorStyles["smart-editor__text--underline"],
				},
				list: {
					checklist: smartEditorStyles["smart-editor__checklist"],
					ul: smartEditorStyles["smart-editor__ul"],
					ol: smartEditorStyles["smart-editor__ol"],
					listitem: smartEditorStyles["smart-editor__li"],
					nested: {
						listitem: smartEditorStyles["smart-editor__li-nested"],
					},
					listitemChecked: smartEditorStyles["smart-editor__li-checked"],
					listitemUnchecked: smartEditorStyles["smart-editor__li-unchecked"],
				},
			},
			nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, HorizontalRuleNode, LinkNode, AutoLinkNode],
			editorState: () => {
				const root = $getRoot();
				root.clear();

				if (structuredData) {
					const nodes = createStructuredNodes(structuredData);
					nodes.forEach((node) => root.append(node));
					return;
				}

				const sourceLines = plainLines && plainLines.length > 0 ? plainLines : [""];
				sourceLines.forEach((line) => {
					const paragraph = $createParagraphNode();
					paragraph.append($createTextNode(line));
					root.append(paragraph);
				});
			},
			onError(error: Error) {
				console.error(error);
			},
		};
	}, [plainLines, structuredData]);

	return (
		<div className={landingStyles["lexical-preview"]}>
			<LexicalComposer initialConfig={initialConfig}>
				<RichTextPlugin
					contentEditable={<ContentEditable className={landingStyles["lexical-preview__content"]} />}
					placeholder={null}
					ErrorBoundary={LexicalErrorBoundary}
				/>
			</LexicalComposer>
		</div>
	);
}
