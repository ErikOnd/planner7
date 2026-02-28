"use client";

import { $createListItemNode, $createListNode } from "@lexical/list";
import { $createHorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { $createHeadingNode } from "@lexical/rich-text";
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$getSelection,
	$isRangeSelection,
	type LexicalEditor,
	type LexicalNode,
} from "lexical";
import { type StructuredInline, type StructuredListItem, type StructuredNotesResponse } from "../../../actions/aiNotes";

function createInlineNodes(segments: StructuredInline[]): LexicalNode[] {
	const safeSegments = segments.length > 0 ? segments : [{ text: "" }];
	return safeSegments.map((segment) => {
		const node = $createTextNode(segment.text ?? "");
		if (segment.bold) {
			node.toggleFormat("bold");
		}
		if (segment.italic) {
			node.toggleFormat("italic");
		}
		if (segment.underline) {
			node.toggleFormat("underline");
		}
		return node;
	});
}

function createListItemNode(item: StructuredListItem, checked = false) {
	const listItemNode = $createListItemNode(checked);
	const paragraphNode = $createParagraphNode();
	paragraphNode.append(...createInlineNodes(item.segments ?? []));
	listItemNode.append(paragraphNode);
	return listItemNode;
}

export function createStructuredNodes(data: StructuredNotesResponse): LexicalNode[] {
	const nodes: LexicalNode[] = [];

	data.blocks.forEach((block) => {
		switch (block.type) {
			case "heading1": {
				const node = $createHeadingNode("h1");
				node.append(...createInlineNodes(block.segments ?? []));
				nodes.push(node);
				return;
			}
			case "heading2": {
				const node = $createHeadingNode("h2");
				node.append(...createInlineNodes(block.segments ?? []));
				nodes.push(node);
				return;
			}
			case "heading3": {
				const node = $createHeadingNode("h3");
				node.append(...createInlineNodes(block.segments ?? []));
				nodes.push(node);
				return;
			}
			case "paragraph": {
				const node = $createParagraphNode();
				node.append(...createInlineNodes(block.segments ?? []));
				nodes.push(node);
				return;
			}
			case "bulleted_list": {
				const listNode = $createListNode("bullet");
				(block.items ?? []).forEach((item) => {
					listNode.append(createListItemNode(item));
				});
				nodes.push(listNode);
				return;
			}
			case "numbered_list": {
				const listNode = $createListNode("number");
				(block.items ?? []).forEach((item) => {
					listNode.append(createListItemNode(item));
				});
				nodes.push(listNode);
				return;
			}
			case "checklist": {
				const listNode = $createListNode("check");
				(block.items ?? []).forEach((item) => {
					listNode.append(createListItemNode(item, Boolean(item.checked)));
				});
				nodes.push(listNode);
				return;
			}
			case "horizontal_rule": {
				nodes.push($createHorizontalRuleNode());
				return;
			}
			default: {
				const fallbackNode = $createParagraphNode();
				fallbackNode.append(...createInlineNodes((block as { segments?: StructuredInline[] }).segments ?? []));
				nodes.push(fallbackNode);
			}
		}
	});

	return nodes;
}

export function insertStructuredNotesAtCurrentSelection(editor: LexicalEditor, data: StructuredNotesResponse): void {
	editor.update(() => {
		const nodes = createStructuredNodes(data);
		if (nodes.length === 0) return;
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			selection.insertNodes(nodes);
			return;
		}
		const root = $getRoot();
		nodes.forEach((node) => root.append(node));
	});
}
