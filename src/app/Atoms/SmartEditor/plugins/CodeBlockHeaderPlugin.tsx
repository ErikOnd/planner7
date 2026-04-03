"use client";

import styles from "../SmartEditor.module.scss";

import { Icon } from "@atoms/Icons/Icon";
import { CodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $nodesOfType, type NodeKey } from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CodeBlockHeaderPluginProps = {
	anchorElem: HTMLElement;
};

type CodeBlockDescriptor = {
	code: string;
	key: NodeKey;
	left: number;
	top: number;
	width: number;
};

async function copyTextToClipboard(text: string) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.setAttribute("readonly", "true");
	textarea.style.position = "absolute";
	textarea.style.opacity = "0";
	textarea.style.pointerEvents = "none";
	document.body.appendChild(textarea);
	textarea.select();
	document.execCommand("copy");
	document.body.removeChild(textarea);
}

export default function CodeBlockHeaderPlugin({ anchorElem }: CodeBlockHeaderPluginProps) {
	const [editor] = useLexicalComposerContext();
	const [codeBlocks, setCodeBlocks] = useState<CodeBlockDescriptor[]>([]);
	const [copiedCodeBlockKey, setCopiedCodeBlockKey] = useState<NodeKey | null>(null);
	const resetCopiedTimeoutRef = useRef<number | null>(null);

	const updateCodeBlocks = useCallback(() => {
		editor.getEditorState().read(() => {
			const anchorRect = anchorElem.getBoundingClientRect();
			const nextCodeBlocks = $nodesOfType(CodeNode).flatMap((codeNode) => {
				const codeElement = editor.getElementByKey(codeNode.getKey());
				if (!(codeElement instanceof HTMLElement)) {
					return [];
				}

				const codeRect = codeElement.getBoundingClientRect();
				return [{
					code: codeNode.getTextContent(),
					key: codeNode.getKey(),
					left: codeRect.left - anchorRect.left,
					top: codeRect.top - anchorRect.top,
					width: codeRect.width,
				}];
			});

			setCodeBlocks(nextCodeBlocks);
		});
	}, [anchorElem, editor]);

	useEffect(() => {
		updateCodeBlocks();

		const unregisterUpdate = editor.registerUpdateListener(() => {
			window.requestAnimationFrame(updateCodeBlocks);
		});
		const unregisterMutation = editor.registerMutationListener(CodeNode, () => {
			window.requestAnimationFrame(updateCodeBlocks);
		});
		const unregisterRoot = editor.registerRootListener((rootElement) => {
			if (!rootElement) {
				return undefined;
			}

			const handleScroll = () => {
				window.requestAnimationFrame(updateCodeBlocks);
			};

			rootElement.addEventListener("scroll", handleScroll, true);
			return () => {
				rootElement.removeEventListener("scroll", handleScroll, true);
			};
		});

		window.addEventListener("resize", updateCodeBlocks);
		window.addEventListener("scroll", updateCodeBlocks, true);

		return () => {
			unregisterUpdate();
			unregisterMutation();
			unregisterRoot();
			window.removeEventListener("resize", updateCodeBlocks);
			window.removeEventListener("scroll", updateCodeBlocks, true);
		};
	}, [editor, updateCodeBlocks]);

	useEffect(() => {
		return () => {
			if (resetCopiedTimeoutRef.current !== null) {
				window.clearTimeout(resetCopiedTimeoutRef.current);
			}
		};
	}, []);

	const handleCopy = useCallback(async (codeBlock: CodeBlockDescriptor) => {
		try {
			await copyTextToClipboard(codeBlock.code);
			setCopiedCodeBlockKey(codeBlock.key);
			if (resetCopiedTimeoutRef.current !== null) {
				window.clearTimeout(resetCopiedTimeoutRef.current);
			}

			resetCopiedTimeoutRef.current = window.setTimeout(() => {
				setCopiedCodeBlockKey(null);
				resetCopiedTimeoutRef.current = null;
			}, 1600);
		} catch {
			setCopiedCodeBlockKey(null);
		}
	}, []);

	if (codeBlocks.length === 0) {
		return null;
	}

	return createPortal(
		<>
			{codeBlocks.map((codeBlock) => (
				<div
					key={codeBlock.key}
					className={styles["smart-editor__code-block-header"]}
					style={{
						left: codeBlock.left + 0.85,
						top: codeBlock.top + 0.65,
						width: Math.max(0, codeBlock.width - 2.4),
					}}
				>
					<button
						type="button"
						className={styles["smart-editor__code-block-action"]}
						onClick={() => void handleCopy(codeBlock)}
						aria-label={copiedCodeBlockKey === codeBlock.key ? "Copied code" : "Copy code"}
						title={copiedCodeBlockKey === codeBlock.key ? "Copied" : "Copy code"}
						data-active={copiedCodeBlockKey === codeBlock.key ? "true" : undefined}
					>
						<Icon name="clipboard" size={18} />
					</button>
				</div>
			))}
		</>,
		anchorElem,
	);
}
