import type { LexicalEditorStateJSON } from "types/noteContent";

export const emptyState: LexicalEditorStateJSON = {
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isContainerNode(type: string) {
	return type === "root" || type === "paragraph" || type === "quote" || type.startsWith("heading");
}

function isLexicalNodeEffectivelyEmpty(node: unknown): boolean {
	if (!isRecord(node)) return true;

	const type = typeof node.type === "string" ? node.type : "";

	if (type === "text") {
		return typeof node.text !== "string" || node.text.trim().length === 0;
	}

	if (!isContainerNode(type)) {
		return false;
	}

	if (!Array.isArray(node.children) || node.children.length === 0) {
		return true;
	}

	return node.children.every((child) => isLexicalNodeEffectivelyEmpty(child));
}

export function isLexicalEditorState(value: unknown): value is LexicalEditorStateJSON {
	if (!isRecord(value)) return false;
	if (!isRecord(value.root)) return false;
	return value.root.type === "root";
}

export function isLexicalEditorStateEffectivelyEmpty(value: unknown): boolean {
	if (!isLexicalEditorState(value)) return true;
	return isLexicalNodeEffectivelyEmpty(value.root);
}

export function hasNonEmptyRoot(value: unknown): boolean {
	if (!isLexicalEditorState(value)) return false;
	return !isLexicalEditorStateEffectivelyEmpty(value);
}

function getBlockText(block: unknown): string {
	if (!isRecord(block)) return "";

	if (typeof block.content === "string") {
		return block.content;
	}

	if (Array.isArray(block.content)) {
		return block.content
			.map((item) => {
				if (!isRecord(item)) return "";
				if (typeof item.text === "string") return item.text;
				return "";
			})
			.join("");
	}

	return "";
}

export function blockNoteToMarkdown(value: unknown): string {
	if (!Array.isArray(value)) return "";

	return value
		.map((block) => {
			if (!isRecord(block)) return "";

			const type = typeof block.type === "string" ? block.type : "paragraph";
			const text = getBlockText(block).trim();

			if (type === "heading" || type === "heading_1") return text ? `# ${text}` : "";
			if (type === "heading_2") return text ? `## ${text}` : "";
			if (type === "heading_3") return text ? `### ${text}` : "";
			if (type === "bulletListItem") return text ? `- ${text}` : "-";
			if (type === "numberedListItem") return text ? `1. ${text}` : "1.";
			if (type === "checkListItem") {
				const checked = block.props && isRecord(block.props) && block.props.checked === true;
				return checked ? `- [x] ${text}` : `- [ ] ${text}`;
			}

			return text;
		})
		.filter(Boolean)
		.join("\n");
}
