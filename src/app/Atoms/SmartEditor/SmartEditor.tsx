"use client";

import styles from "./SmartEditor.module.scss";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { uploadImage } from "@/actions/upload-image";
import { useTheme } from "@/contexts/ThemeContext";
import { type Block } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { useBlocknoteArrowUpFix } from "@hooks/useBlocknoteArrowUpFix";
import useScreenSize from "@hooks/useScreenSize";
import { getSlashMenuItemsWithAliases } from "@utils/blocknoteSlashMenu";
import { BREAKPOINTS } from "../../constants";

type SmartEditorProps = {
	initialContent?: Block[];
	onChange?: (content: Block[]) => void;
	ariaLabel?: string;
};

export default function SmartEditor({ initialContent, onChange, ariaLabel }: SmartEditorProps) {
	const { effectiveTheme, mounted } = useTheme();

	const handleUpload = async (file: File) => {
		const formData = new FormData();
		formData.append("file", file);
		return await uploadImage(formData);
	};

	const editor = useCreateBlockNote({
		initialContent,
		uploadFile: handleUpload,
	});

	const screenSize = useScreenSize();
	const isNotMobile = screenSize.width > BREAKPOINTS.mobile;

	useBlocknoteArrowUpFix(editor);

	if (typeof window === "undefined" || !mounted) return null;

	const aliasMap = { "Check list": ["todo", "to-do"] };

	return (
		<BlockNoteView
			editor={editor}
			className={styles["smart-editor"]}
			theme={effectiveTheme}
			slashMenu={false}
			sideMenu={isNotMobile}
			filePanel={true}
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
