export type NoteContent = unknown;

export type LexicalRootNode = {
	children: unknown[];
	direction: "ltr" | "rtl" | null;
	format: string;
	indent: number;
	type: "root";
	version: number;
};

export type LexicalEditorStateJSON = {
	root: LexicalRootNode;
};
