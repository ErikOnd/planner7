"use client";

import styles from "../SmartEditor.module.scss";

import { $createCodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	LexicalTypeaheadMenuPlugin,
	MenuOption,
	useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	type ElementNode,
	type LexicalEditor,
} from "lexical";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

type SlashCommand = {
	title: string;
	keywords: string[];
	run: (editor: LexicalEditor) => void;
};

class SlashCommandOption extends MenuOption {
	title: string;
	keywords: string[];
	run: (editor: LexicalEditor) => void;

	constructor(command: SlashCommand) {
		super(command.title);
		this.title = command.title;
		this.keywords = command.keywords;
		this.run = command.run;
	}
}

function setBlockType(editor: LexicalEditor, createNode: () => ElementNode) {
	editor.update(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			$setBlocksType(selection, createNode);
		}
	});
}

export default function SlashCommandPlugin() {
	const [editor] = useLexicalComposerContext();
	const [queryString, setQueryString] = useState<string | null>(null);
	const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", { minLength: 0 });

	const commands = useMemo<SlashCommandOption[]>(() => {
		const slashCommands: SlashCommand[] = [
			{
				title: "Paragraph",
				keywords: ["text", "normal", "p"],
				run: (activeEditor) => setBlockType(activeEditor, () => $createParagraphNode()),
			},
			{
				title: "Heading 1",
				keywords: ["h1", "title"],
				run: (activeEditor) => setBlockType(activeEditor, () => $createHeadingNode("h1")),
			},
			{
				title: "Heading 2",
				keywords: ["h2", "subtitle"],
				run: (activeEditor) => setBlockType(activeEditor, () => $createHeadingNode("h2")),
			},
			{
				title: "Heading 3",
				keywords: ["h3"],
				run: (activeEditor) => setBlockType(activeEditor, () => $createHeadingNode("h3")),
			},
			{
				title: "Bulleted List",
				keywords: ["list", "ul", "bullet"],
				run: (activeEditor) => activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
			},
			{
				title: "Numbered List",
				keywords: ["list", "ol", "numbered"],
				run: (activeEditor) => activeEditor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
			},
			{
				title: "Checklist",
				keywords: ["todo", "task", "check"],
				run: (activeEditor) => activeEditor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
			},
			{
				title: "Quote",
				keywords: ["blockquote", "citation"],
				run: (activeEditor) => setBlockType(activeEditor, () => $createQuoteNode()),
			},
			{
				title: "Code Block",
				keywords: ["code", "snippet", "pre"],
				run: (activeEditor) => setBlockType(activeEditor, () => $createCodeNode()),
			},
		];

		const query = (queryString ?? "").toLowerCase().trim();
		const filtered = !query
			? slashCommands
			: slashCommands.filter((command) => {
				const titleMatch = command.title.toLowerCase().includes(query);
				const keywordMatch = command.keywords.some((keyword) => keyword.includes(query));
				return titleMatch || keywordMatch;
			});

		return filtered.map((command) => new SlashCommandOption(command));
	}, [queryString]);

	return (
		<LexicalTypeaheadMenuPlugin<SlashCommandOption>
			onQueryChange={setQueryString}
			triggerFn={checkForSlashTriggerMatch}
			options={commands}
			onSelectOption={(selectedOption, nodeToRemove, closeMenu) => {
				editor.update(() => {
					if (nodeToRemove) {
						nodeToRemove.remove();
					}
				});
				selectedOption.run(editor);
				closeMenu();
			}}
			menuRenderFn={(anchorElementRef, { selectedIndex, setHighlightedIndex, selectOptionAndCleanUp }) => {
				if (!anchorElementRef.current || commands.length === 0) return null;

				return createPortal(
					<div className={styles["smart-editor__slash-menu"]} role="listbox" aria-label="Slash commands">
						{commands.map((option, index) => (
							<button
								key={option.key}
								type="button"
								className={styles["smart-editor__slash-menu-item"]}
								data-selected={selectedIndex === index}
								onMouseEnter={() => setHighlightedIndex(index)}
								onMouseDown={(event) => {
									event.preventDefault();
									setHighlightedIndex(index);
									selectOptionAndCleanUp(option);
								}}
							>
								{option.title}
							</button>
						))}
					</div>,
					anchorElementRef.current,
				);
			}}
		/>
	);
}
