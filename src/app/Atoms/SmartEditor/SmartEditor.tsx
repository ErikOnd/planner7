"use client";

import styles from "./SmartEditor.module.scss";

import { en } from "@blocknote/core/locales";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useTheme } from "@/contexts/ThemeContext";
import { type Block, filterSuggestionItems } from "@blocknote/core";
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { useBlocknoteArrowUpFix } from "@hooks/useBlocknoteArrowUpFix";
import { getSlashMenuItemsWithAliases } from "@utils/blocknoteSlashMenu";

type SmartEditorProps = {
	initialContent?: Block[];
	onChange?: (content: Block[]) => void;
};

export default function SmartEditor({ initialContent, onChange }: SmartEditorProps) {
	const { effectiveTheme, mounted } = useTheme();

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
			theme={effectiveTheme}
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
