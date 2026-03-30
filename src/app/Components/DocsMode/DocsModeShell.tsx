"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import SmartEditor from "@atoms/SmartEditor/SmartEditor";
import { emptyState, isLexicalEditorState } from "@atoms/SmartEditor/utils/content";
import { Text } from "@atoms/Text/Text";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { NoteContent } from "types/noteContent";
import styles from "./DocsModeShell.module.scss";

type DocsDocument = {
	id: string;
	title: string;
	content: string;
	createdAt: number;
	updatedAt: number;
	tag?: string;
};

const DOC_TAG_OPTIONS = [
	"Brainstorming",
	"Product planning",
	"User research",
	"Technical spec",
	"Meeting notes",
] as const;

const INITIAL_DOCS: DocsDocument[] = [];
const DOCS_STORAGE_KEY = "planner7:docs:v1";
const EMPTY_DOC_CONTENT = JSON.stringify(emptyState);
const EMPTY_DOCUMENT_PREVIEW = "Start writing in this document.";

type PersistedDocsState = {
	documents: DocsDocument[];
	selectedDocumentId: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function buildDocsStorageKey(workspaceId: string | null) {
	return `${DOCS_STORAGE_KEY}:${workspaceId ?? "default"}`;
}

function normalizePersistedDocument(rawDocument: unknown): DocsDocument | null {
	if (!isRecord(rawDocument)) return null;

	const id = typeof rawDocument.id === "string" ? rawDocument.id : "";
	const title = typeof rawDocument.title === "string" ? rawDocument.title.trim() : "";
	if (!id || !title) return null;

	const fallbackTimestamp = Date.now();
	const createdAt = typeof rawDocument.createdAt === "number" ? rawDocument.createdAt : fallbackTimestamp;
	const updatedAt = typeof rawDocument.updatedAt === "number" ? rawDocument.updatedAt : createdAt;
	const tag = typeof rawDocument.tag === "string" && rawDocument.tag.trim().length > 0
		? rawDocument.tag.trim()
		: undefined;
	const content = typeof rawDocument.content === "string" && rawDocument.content.trim().length > 0
		? rawDocument.content
		: EMPTY_DOC_CONTENT;

	return {
		id,
		title,
		content,
		createdAt,
		updatedAt,
		tag,
	};
}

function readPersistedDocs(workspaceId: string | null): PersistedDocsState | null {
	if (typeof window === "undefined") return null;

	try {
		const raw = window.localStorage.getItem(buildDocsStorageKey(workspaceId));
		if (!raw) return null;

		const parsed = JSON.parse(raw) as Partial<PersistedDocsState> | null;
		if (!parsed || !Array.isArray(parsed.documents)) return null;

		return {
			documents: parsed.documents
				.map((document) => normalizePersistedDocument(document))
				.filter((document): document is DocsDocument => document !== null),
			selectedDocumentId: typeof parsed.selectedDocumentId === "string" ? parsed.selectedDocumentId : null,
		};
	} catch {
		return null;
	}
}

function persistDocs(workspaceId: string | null, state: PersistedDocsState) {
	if (typeof window === "undefined") return;

	try {
		window.localStorage.setItem(buildDocsStorageKey(workspaceId), JSON.stringify(state));
	} catch {
		// Ignore local storage write failures.
	}
}

function getRelativeTimeLabel(timestamp: number) {
	const elapsedMs = Date.now() - timestamp;
	const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60000));

	if (elapsedMinutes < 1) return "just now";
	if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;

	const elapsedHours = Math.floor(elapsedMinutes / 60);
	if (elapsedHours < 24) return elapsedHours === 1 ? "1 hour ago" : `${elapsedHours} hours ago`;

	const elapsedDays = Math.floor(elapsedHours / 24);
	if (elapsedDays < 7) return elapsedDays === 1 ? "yesterday" : `${elapsedDays} days ago`;

	const elapsedWeeks = Math.floor(elapsedDays / 7);
	return elapsedWeeks === 1 ? "last week" : `${elapsedWeeks} weeks ago`;
}

function extractTextFromLexicalNode(node: unknown): string {
	if (!isRecord(node)) return "";

	if (node.type === "text" && typeof node.text === "string") {
		return node.text;
	}

	if (!Array.isArray(node.children)) return "";

	return node.children
		.map((child) => extractTextFromLexicalNode(child))
		.filter(Boolean)
		.join(" ");
}

function buildDocumentPreview(content: string) {
	try {
		const parsedContent = JSON.parse(content);
		if (!isLexicalEditorState(parsedContent)) {
			return EMPTY_DOCUMENT_PREVIEW;
		}

		const rawText = extractTextFromLexicalNode(parsedContent.root).replace(/\s+/g, " ").trim();
		if (!rawText) {
			return EMPTY_DOCUMENT_PREVIEW;
		}

		return rawText.length > 72 ? `${rawText.slice(0, 71).trimEnd()}…` : rawText;
	} catch {
		return EMPTY_DOCUMENT_PREVIEW;
	}
}

function buildDocumentMeta(document: DocsDocument) {
	const prefix = document.updatedAt > document.createdAt ? "Edited" : "Created";
	return `${prefix} ${getRelativeTimeLabel(document.updatedAt)}`;
}

function normalizeDocumentContent(content: NoteContent) {
	if (typeof content === "string" && content.trim().length > 0) {
		return content;
	}

	return EMPTY_DOC_CONTENT;
}

function buildDocument(title: string, tag?: string): DocsDocument {
	const trimmedTitle = title.trim();
	const trimmedTag = tag?.trim() || undefined;
	const timestamp = Date.now();
	const normalizedId = trimmedTitle
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return {
		id: `${normalizedId || "untitled-document"}-${timestamp}`,
		title: trimmedTitle,
		content: EMPTY_DOC_CONTENT,
		createdAt: timestamp,
		updatedAt: timestamp,
		tag: trimmedTag,
	};
}

export function DocsModeShell() {
	const { activeWorkspaceId, activeWorkspaceName } = useWorkspace();
	const [documents, setDocuments] = useState(INITIAL_DOCS);
	const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
	const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null);
	const [isCreatingDocument, setIsCreatingDocument] = useState(false);
	const [draftTitle, setDraftTitle] = useState("");
	const [draftTag, setDraftTag] = useState("");

	const selectedDocument = useMemo(() => {
		if (documents.length === 0) return null;
		if (!selectedDocumentId) return documents[0];
		return documents.find((document) => document.id === selectedDocumentId) ?? documents[0];
	}, [documents, selectedDocumentId]);

	const normalizedDraftTitle = draftTitle.trim();
	const normalizedDraftTag = draftTag.trim();
	const canCreateDocument = normalizedDraftTitle.length > 0;
	const showSetupState = isCreatingDocument || documents.length === 0;
	const showSetupCancel = documents.length > 0;

	const openCreateComposer = () => {
		if (isCreatingDocument) return;

		setDraftTitle("");
		setDraftTag("");
		setIsCreatingDocument(true);
	};

	const closeCreateComposer = () => {
		setIsCreatingDocument(false);
		setDraftTitle("");
		setDraftTag("");
	};

	const handleCreateDocument = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!canCreateDocument) return;

		const nextDocument = buildDocument(normalizedDraftTitle, normalizedDraftTag);

		setDocuments((currentDocuments) => [nextDocument, ...currentDocuments]);
		setSelectedDocumentId(nextDocument.id);
		closeCreateComposer();
	};

	const handleDocumentContentChange = useCallback((documentId: string, nextContent: NoteContent) => {
		const normalizedContent = normalizeDocumentContent(nextContent);

		setDocuments((currentDocuments) => {
			const documentIndex = currentDocuments.findIndex((document) => document.id === documentId);
			if (documentIndex === -1) {
				return currentDocuments;
			}

			const currentDocument = currentDocuments[documentIndex];
			if (currentDocument.content === normalizedContent) {
				return currentDocuments;
			}

			const nextDocuments = [...currentDocuments];
			nextDocuments[documentIndex] = {
				...currentDocument,
				content: normalizedContent,
				updatedAt: Date.now(),
			};

			return nextDocuments;
		});
	}, []);

	useEffect(() => {
		const nextStorageKey = buildDocsStorageKey(activeWorkspaceId);
		const persistedState = readPersistedDocs(activeWorkspaceId);
		setDocuments(persistedState?.documents ?? INITIAL_DOCS);
		setSelectedDocumentId(persistedState?.selectedDocumentId ?? null);
		setHydratedStorageKey(nextStorageKey);
		setIsCreatingDocument(false);
		setDraftTitle("");
		setDraftTag("");
	}, [activeWorkspaceId]);

	useEffect(() => {
		if (hydratedStorageKey !== buildDocsStorageKey(activeWorkspaceId)) {
			return;
		}

		const nextSelectedDocumentId = documents.some((document) => document.id === selectedDocumentId)
			? selectedDocumentId
			: documents[0]?.id ?? null;

		persistDocs(activeWorkspaceId, {
			documents,
			selectedDocumentId: nextSelectedDocumentId,
		});
	}, [activeWorkspaceId, documents, hydratedStorageKey, selectedDocumentId]);

	return (
		<div className={styles["docs-mode"]}>
			<aside className={styles["docs-panel"]}>
				<div className={styles["panel-top"]}>
					<div className={styles["brand"]}>
						<Image
							src="/logo-full-dark.svg"
							alt="Planner7 logo"
							width={272}
							height={50}
							className={styles["brand-logo"]}
							priority
						/>
					</div>

					<div className={styles["panel-heading"]}>
						<h1 className={styles["panel-title"]}>Documents</h1>
						<p className={styles["panel-copy"]}>
							Create rich planning sheets here with full Lexical editing, tables, sticky notes, and Excalidraw.
						</p>
					</div>
				</div>

				<div className={styles["workspace-card"]}>
					<span className={styles["workspace-card-label"]}>Workspace</span>
					<span className={styles["workspace-card-name"]}>
						{activeWorkspaceName ?? "Planner7 Workspace"}
					</span>
				</div>

				<Button
					type="button"
					variant="primary"
					size="lg"
					className={styles["create-button"]}
					onClick={openCreateComposer}
					icon="plus"
					wrapText={false}
				>
					New document
				</Button>

				<div className={styles["panel-section"]}>
					<div className={styles["section-header"]}>
						<span className={styles["section-label"]}>Documents</span>
						<span className={styles["section-meta"]}>{documents.length}</span>
					</div>
					<div className={styles["document-list"]}>
						{documents.length === 0
							? (
								<div className={styles["document-empty"]}>
									<Text size="sm" fontWeight={700}>No documents yet</Text>
									<Text size="xs">Create a document to start shaping the space.</Text>
								</div>
							)
							: documents.map((document) => {
								const isActive = !showSetupState && document.id === selectedDocument?.id;

								return (
									<button
										key={document.id}
										type="button"
										className={styles["document-card"]}
										data-active={isActive ? "true" : "false"}
										onClick={() => {
											setIsCreatingDocument(false);
											setSelectedDocumentId(document.id);
										}}
									>
										<div className={styles["document-card-title-row"]}>
											<span className={styles["document-card-title"]}>{document.title}</span>
											<span className={styles["document-card-meta"]}>{buildDocumentMeta(document)}</span>
										</div>
										{document.tag
											? <span className={styles["document-card-tag"]}>{document.tag}</span>
											: null}
										<p className={styles["document-card-copy"]}>{buildDocumentPreview(document.content)}</p>
									</button>
								);
							})}
					</div>
				</div>
			</aside>

			<section className={styles["docs-main"]}>
				<div className={styles["docs-main-topbar"]}>
					<Button
						href="/app"
						variant="secondary"
						size="sm"
						className={styles["main-back-link"]}
						icon="chevron-left"
						wrapText={false}
					>
						Back to Planner
					</Button>
					{!showSetupState && selectedDocument
						? <h2 className={styles["main-document-title"]}>{selectedDocument.title}</h2>
						: null}
				</div>
				{showSetupState
					? (
						<div className={`${styles["document-stage"]} ${styles["setup-stage"]}`}>
							<div className={styles["setup-card"]}>
								<div className={styles["setup-card-icon"]}>
									<Icon name="notebook-pen" size={30} />
								</div>
								<div className={styles["setup-card-copy"]}>
									<span className={styles["stage-label"]}>New document</span>
									<h2 className={styles["setup-card-title"]}>Set up a new document</h2>
									<p className={styles["setup-card-description"]}>
										Prepare your workspace. Set up the details before you start drafting your next masterpiece.
									</p>
								</div>

								<form className={styles["creation-form"]} onSubmit={handleCreateDocument}>
									<div className={styles["field-group"]}>
										<label htmlFor="docs-document-title" className={styles["field-label"]}>
											Document title
										</label>
										<input
											id="docs-document-title"
											type="text"
											className={styles["field-input"]}
											value={draftTitle}
											onChange={(event) => setDraftTitle(event.target.value)}
											placeholder="Untitled document"
											autoFocus
											maxLength={120}
										/>
									</div>

									<div className={styles["field-group"]}>
										<div className={styles["field-heading-row"]}>
											<span className={styles["field-label"]}>Select purpose</span>
											<span className={styles["field-optional"]}>Choose one</span>
										</div>
										<div className={styles["tag-list"]}>
											{DOC_TAG_OPTIONS.map((tagOption) => {
												const isActive = normalizedDraftTag.toLowerCase() === tagOption.toLowerCase();

												return (
													<button
														key={tagOption}
														type="button"
														className={styles["tag-chip"]}
														data-active={isActive ? "true" : "false"}
														onClick={() => setDraftTag(isActive ? "" : tagOption)}
													>
														{tagOption}
													</button>
												);
											})}
										</div>
										<label htmlFor="docs-document-tag" className={styles["field-label-secondary"]}>
											Custom tag
										</label>
										<input
											id="docs-document-tag"
											type="text"
											className={`${styles["field-input"]} ${styles["field-input-secondary"]}`}
											value={draftTag}
											onChange={(event) => setDraftTag(event.target.value)}
											placeholder="Optional"
											maxLength={40}
										/>
									</div>

									<div className={styles["creation-actions"]}>
										<Button
											type="submit"
											variant="primary"
											size="lg"
											className={styles["create-submit"]}
											wrapText={false}
											disabled={!canCreateDocument}
										>
											Create document
										</Button>
										{showSetupCancel
											? (
												<Button
													type="button"
													variant="ghost"
													size="lg"
													onClick={closeCreateComposer}
													className={styles["cancel-button"]}
													wrapText={false}
												>
													Cancel
												</Button>
											)
											: null}
									</div>
								</form>
							</div>
						</div>
					)
					: selectedDocument
					? (
						<div className={styles["document-editor-stage"]}>
							<div className={styles["document-editor-shell"]}>
								<SmartEditor
									initialContent={selectedDocument.content}
									onChange={(content) => handleDocumentContentChange(selectedDocument.id, content)}
									ariaLabel={`${selectedDocument.title} document editor`}
									variant="document"
									placeholder="Start writing your document…"
								/>
							</div>
						</div>
					)
					: null}
			</section>
		</div>
	);
}
