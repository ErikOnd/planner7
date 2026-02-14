"use client";

import { $createCodeNode, registerCodeHighlighting } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

export { $createCodeNode };

export default function CodeHighlightingPlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return registerCodeHighlighting(editor);
	}, [editor]);

	return null;
}
