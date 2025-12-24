"use client";

import styles from "./SmartEditor.module.scss";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@mantine/core/styles.css";
import { useTheme } from "@/contexts/ThemeContext";
import { type Block } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { useBlocknoteArrowUpFix } from "@hooks/useBlocknoteArrowUpFix";
import { getSlashMenuItemsWithAliases } from "@utils/blocknoteSlashMenu";

type SmartEditorProps = {
	initialContent?: Block[];
	onChange?: (content: Block[]) => void;
	ariaLabel?: string;
};

export default function SmartEditor({ initialContent, onChange, ariaLabel }: SmartEditorProps) {
	const { effectiveTheme, mounted } = useTheme();

	const editor = useCreateBlockNote({
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
			data-content-editable-leaf="true"
			aria-label={ariaLabel || "Text editor"}
		>
			<SuggestionMenuController
				triggerCharacter="/"
				getItems={async (query) => filterSuggestionItems(getSlashMenuItemsWithAliases(editor, aliasMap), query)}
			/>
		</BlockNoteView>
	);
}
