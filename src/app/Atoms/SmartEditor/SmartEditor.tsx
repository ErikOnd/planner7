"use client";

import styles from "./SmartEditor.module.scss";

import { en } from "@blocknote/core/locales";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { filterSuggestionItems, type Block } from "@blocknote/core";
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { getSlashMenuItemsWithAliases } from "@utils/blocknoteSlashMenu";
import { useTheme } from "@/contexts/ThemeContext";
import { useBlocknoteArrowUpFix } from "@hooks/useBlocknoteArrowUpFix";

type SmartEditorProps = {
	initialContent?: Block[];
	onChange?: (content: Block[]) => void;
};

export default function SmartEditor({ initialContent, onChange }: SmartEditorProps) {
	const { theme, mounted } = useTheme();

	const editor = useCreateBlockNote({
		dictionary: {
			...en,
			placeholders: { ...en.placeholders, emptyDocument: "Start typing.." },
		},
		initialContent,
	});

	useBlocknoteArrowUpFix(editor);

	if (typeof window === "undefined" || !mounted) return null;

	const aliasMap = { "Check list": ["todo", "to-do"] };

	return (
		<BlockNoteView
			editor={editor}
			className={styles["smart-editor"]}
			theme={theme}
			slashMenu={false}
			onChange={() => {
				if (onChange) {
					onChange(editor.document);
				}
			}}
		>
			<SuggestionMenuController
				triggerCharacter="/"
				getItems={async (query) => filterSuggestionItems(getSlashMenuItemsWithAliases(editor, aliasMap), query)}
			/>
		</BlockNoteView>
	);
}
