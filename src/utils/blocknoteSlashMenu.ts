import type { BlockNoteEditor } from "@blocknote/core";
import type { DefaultReactSuggestionItem } from "@blocknote/react";
import { getDefaultReactSlashMenuItems } from "@blocknote/react";

export type AliasMap = Record<string, string[]>;

export function getSlashMenuItemsWithAliases(
	editor: BlockNoteEditor,
	aliasMap: AliasMap,
): DefaultReactSuggestionItem[] {
	const norm = (s: string) => s.trim().toLowerCase();

	return getDefaultReactSlashMenuItems(editor).map((item) => {
		const matchKey = Object.keys(aliasMap).find(
			(k) => norm(k) === norm(item.title) || norm(item.title).includes(norm(k)),
		);
		if (!matchKey) return item;

		const extra = aliasMap[matchKey] ?? [];
		if (!extra.length) return item;

		return { ...item, aliases: [...(item.aliases ?? []), ...extra] };
	});
}
