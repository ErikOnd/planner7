"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import SmartEditor from "@atoms/SmartEditor/SmartEditor";
import { emptyState, isLexicalEditorState } from "@atoms/SmartEditor/utils/content";
import { Text } from "@atoms/Text/Text";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { AlertDialog } from "radix-ui";
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

function normalizeOptionalText(value: string | null | undefined) {
	const trimmedValue = value?.trim();
	return trimmedValue ? trimmedValue : undefined;
}

function findDocumentById(documents: DocsDocument[], documentId: string | null) {
	if (!documentId) return null;
	return documents.find((document) => document.id === documentId) ?? null;
}

function normalizePersistedDocument(rawDocument: unknown): DocsDocument | null {
	if (!isRecord(rawDocument)) return null;

	const id = typeof rawDocument.id === "string" ? rawDocument.id : "";
	const title = typeof rawDocument.title === "string" ? rawDocument.title.trim() : "";
	if (!id || !title) return null;

	const fallbackTimestamp = Date.now();
	const createdAt = typeof rawDocument.createdAt === "number" ? rawDocument.createdAt : fallbackTimestamp;
	const updatedAt = typeof rawDocument.updatedAt === "number" ? rawDocument.updatedAt : createdAt;
	const tag = typeof rawDocument.tag === "string" ? normalizeOptionalText(rawDocument.tag) : undefined;
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
	const trimmedTag = normalizeOptionalText(tag);
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

function resolveSelectedDocumentId(documents: DocsDocument[], selectedDocumentId: string | null) {
	if (documents.length === 0) return null;
	if (!selectedDocumentId) return documents[0].id;
	return documents.some((document) => document.id === selectedDocumentId) ? selectedDocumentId : documents[0].id;
}

type DocumentTagEditorProps = {
	fieldLabel: string;
	fieldOptionalLabel: string;
	customInputId: string;
	value: string;
	onChange: (value: string) => void;
};

function DocumentTagEditor({
	fieldLabel,
	fieldOptionalLabel,
	customInputId,
	value,
	onChange,
}: DocumentTagEditorProps) {
	const normalizedValue = value.trim().toLowerCase();

	return (
		<div className={styles["field-group"]}>
			<div className={styles["field-heading-row"]}>
				<span className={styles["field-label"]}>{fieldLabel}</span>
				<span className={styles["field-optional"]}>{fieldOptionalLabel}</span>
			</div>
			<div className={styles["tag-list"]}>
				{DOC_TAG_OPTIONS.map((tagOption) => {
					const isActive = normalizedValue === tagOption.toLowerCase();

					return (
						<button
							key={tagOption}
							type="button"
							className={styles["tag-chip"]}
							data-active={isActive ? "true" : "false"}
							onClick={() => onChange(isActive ? "" : tagOption)}
						>
							{tagOption}
						</button>
					);
				})}
			</div>
			<label htmlFor={customInputId} className={styles["field-label-secondary"]}>
				Custom tag
			</label>
			<input
				id={customInputId}
				type="text"
				className={`${styles["field-input"]} ${styles["field-input-secondary"]}`}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder="Optional"
				maxLength={40}
			/>
		</div>
	);
}

type DocumentSettingsDialogProps = {
	open: boolean;
	document: DocsDocument | null;
	titleValue: string;
	tagValue: string;
	canSave: boolean;
	onTitleChange: (value: string) => void;
	onTagChange: (value: string) => void;
	onClose: () => void;
	onDeleteClick: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function DocumentSettingsDialog({
	open,
	document,
	titleValue,
	tagValue,
	canSave,
	onTitleChange,
	onTagChange,
	onClose,
	onDeleteClick,
	onSubmit,
}: DocumentSettingsDialogProps) {
	return (
		<Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className={styles["document-settings-overlay"]} />
				<Dialog.Content className={styles["document-settings-dialog"]}>
					<div className={styles["document-settings-header"]}>
						<div className={styles["document-settings-heading"]}>
							<Dialog.Title className={styles["document-settings-title"]}>Document settings</Dialog.Title>
							<Dialog.Description className={styles["document-settings-description"]}>
								Update the name, adjust the tag, or remove this document.
							</Dialog.Description>
						</div>
						<Dialog.Close asChild>
							<button
								type="button"
								className={styles["document-settings-close"]}
								aria-label="Close document settings"
							>
								<Icon name="close" size={18} />
							</button>
						</Dialog.Close>
					</div>

					{document
						? (
							<form className={styles["document-settings-form"]} onSubmit={onSubmit}>
								<div className={styles["field-group"]}>
									<label htmlFor="docs-settings-title" className={styles["field-label"]}>
										Document title
									</label>
									<input
										id="docs-settings-title"
										type="text"
										className={styles["field-input"]}
										value={titleValue}
										onChange={(event) => onTitleChange(event.target.value)}
										placeholder="Untitled document"
										autoFocus
										maxLength={120}
									/>
								</div>

								<DocumentTagEditor
									fieldLabel="Tag"
									fieldOptionalLabel="Choose or write one"
									customInputId="docs-settings-tag"
									value={tagValue}
									onChange={onTagChange}
								/>

								<div className={styles["document-settings-danger-zone"]}>
									<div className={styles["document-settings-danger-copy"]}>
										<span className={styles["document-settings-danger-title"]}>Delete document</span>
										<p className={styles["document-settings-danger-text"]}>
											Remove <strong>{document.title}</strong> and its editor content from this workspace.
										</p>
									</div>
									<Button
										type="button"
										variant="danger"
										size="sm"
										icon="trash"
										onClick={onDeleteClick}
									>
										Delete
									</Button>
								</div>

								<div className={styles["document-settings-actions"]}>
									<Button type="button" variant="ghost" size="lg" onClick={onClose}>
										Cancel
									</Button>
									<Button type="submit" variant="primary" size="lg" disabled={!canSave}>
										Save changes
									</Button>
								</div>
							</form>
						)
						: null}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

type DocumentDeleteDialogProps = {
	open: boolean;
	documentTitle: string | null;
	confirmationValue: string;
	isConfirmationValid: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirmationChange: (value: string) => void;
	onConfirm: () => void;
};

function DocumentDeleteDialog({
	open,
	documentTitle,
	confirmationValue,
	isConfirmationValid,
	onOpenChange,
	onConfirmationChange,
	onConfirm,
}: DocumentDeleteDialogProps) {
	return (
		<AlertDialog.Root open={open} onOpenChange={onOpenChange}>
			<AlertDialog.Portal>
				<AlertDialog.Overlay className={styles["document-delete-overlay"]} />
				<AlertDialog.Content className={styles["document-delete-dialog"]}>
					<AlertDialog.Title className={styles["document-delete-title"]}>
						Delete document?
					</AlertDialog.Title>
					<AlertDialog.Description className={styles["document-delete-description"]}>
						{documentTitle
							? (
								<>
									This action <strong>cannot be undone.</strong> Type the document name to permanently delete{" "}
									<strong>{documentTitle}</strong>
									.
								</>
							)
							: "This action cannot be undone."}
					</AlertDialog.Description>

					{documentTitle
						? (
							<label className={styles["document-delete-field"]}>
								<span className={styles["document-delete-label"]}>
									Type{" "}
									<strong className={styles["document-delete-label-name"]}>
										{documentTitle.toUpperCase()}
									</strong>{" "}
									to confirm
								</span>
								<input
									type="text"
									value={confirmationValue}
									onChange={(event) => onConfirmationChange(event.target.value)}
									className={`${styles["field-input"]} ${styles["field-input-secondary"]} ${
										styles["document-delete-input"]
									}`}
									placeholder="Enter document name"
									autoComplete="off"
									autoFocus
								/>
							</label>
						)
						: null}

					<div className={styles["document-delete-actions"]}>
						<AlertDialog.Cancel asChild>
							<Button type="button" variant="secondary" size="lg">
								Cancel
							</Button>
						</AlertDialog.Cancel>
						<AlertDialog.Action asChild>
							<Button
								type="button"
								variant="danger"
								size="lg"
								icon="trash"
								onClick={onConfirm}
								disabled={!isConfirmationValid}
							>
								Delete permanently
							</Button>
						</AlertDialog.Action>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	);
}

export function DocsModeShell() {
	const { activeWorkspaceId } = useWorkspace();
	const [documents, setDocuments] = useState(INITIAL_DOCS);
	const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
	const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null);
	const [isCreatingDocument, setIsCreatingDocument] = useState(false);
	const [draftTitle, setDraftTitle] = useState("");
	const [draftTag, setDraftTag] = useState("");
	const [settingsDocumentId, setSettingsDocumentId] = useState<string | null>(null);
	const [settingsTitle, setSettingsTitle] = useState("");
	const [settingsTag, setSettingsTag] = useState("");
	const [isDeleteDocumentOpen, setIsDeleteDocumentOpen] = useState(false);
	const [deleteDocumentConfirmation, setDeleteDocumentConfirmation] = useState("");

	const resolvedSelectedDocumentId = useMemo(
		() => resolveSelectedDocumentId(documents, selectedDocumentId),
		[documents, selectedDocumentId],
	);
	const selectedDocument = useMemo(
		() => findDocumentById(documents, resolvedSelectedDocumentId),
		[documents, resolvedSelectedDocumentId],
	);
	const settingsDocument = useMemo(() => findDocumentById(documents, settingsDocumentId), [
		documents,
		settingsDocumentId,
	]);

	const normalizedDraftTitle = draftTitle.trim();
	const normalizedDraftTag = draftTag.trim();
	const normalizedSettingsTitle = settingsTitle.trim();
	const normalizedSettingsTag = settingsTag.trim();
	const canCreateDocument = normalizedDraftTitle.length > 0;
	const canSaveSettings = normalizedSettingsTitle.length > 0;
	const showSetupState = isCreatingDocument || documents.length === 0;
	const showSetupCancel = documents.length > 0;
	const isSettingsOpen = settingsDocument !== null;
	const isDeleteDocumentConfirmationValid = settingsDocument
		? deleteDocumentConfirmation.trim().toLowerCase() === settingsDocument.title.trim().toLowerCase()
		: false;

	const resetDocumentSettingsState = useCallback(() => {
		setSettingsDocumentId(null);
		setSettingsTitle("");
		setSettingsTag("");
		setIsDeleteDocumentOpen(false);
		setDeleteDocumentConfirmation("");
	}, []);

	const resetCreateComposerState = useCallback(() => {
		setDraftTitle("");
		setDraftTag("");
	}, []);

	const openCreateComposer = useCallback(() => {
		if (isCreatingDocument) return;

		resetCreateComposerState();
		resetDocumentSettingsState();
		setIsCreatingDocument(true);
	}, [isCreatingDocument, resetCreateComposerState, resetDocumentSettingsState]);

	const closeCreateComposer = useCallback(() => {
		setIsCreatingDocument(false);
		resetCreateComposerState();
	}, [resetCreateComposerState]);

	const closeDocumentSettings = resetDocumentSettingsState;

	const handleSelectDocument = useCallback((documentId: string) => {
		setIsCreatingDocument(false);
		setSelectedDocumentId(documentId);
		resetDocumentSettingsState();
	}, [resetDocumentSettingsState]);

	const handleCreateDocument = useCallback((event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!canCreateDocument) return;

		const nextDocument = buildDocument(normalizedDraftTitle, normalizedDraftTag);

		setDocuments((currentDocuments) => [nextDocument, ...currentDocuments]);
		setSelectedDocumentId(nextDocument.id);
		closeCreateComposer();
	}, [canCreateDocument, closeCreateComposer, normalizedDraftTag, normalizedDraftTitle]);

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

	const openDocumentSettings = useCallback((document: DocsDocument) => {
		setIsCreatingDocument(false);
		setSettingsDocumentId(document.id);
		setSettingsTitle(document.title);
		setSettingsTag(document.tag ?? "");
		setIsDeleteDocumentOpen(false);
		setDeleteDocumentConfirmation("");
	}, []);

	const handleSaveDocumentSettings = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!settingsDocument || !canSaveSettings) return;

		const nextTitle = normalizedSettingsTitle;
		const nextTag = normalizeOptionalText(normalizedSettingsTag);
		const currentTag = settingsDocument.tag ?? undefined;
		const hasChanges = settingsDocument.title !== nextTitle || currentTag !== nextTag;

		if (hasChanges) {
			setDocuments((currentDocuments) =>
				currentDocuments.map((document) =>
					document.id === settingsDocument.id
						? {
							...document,
							title: nextTitle,
							tag: nextTag,
							updatedAt: Date.now(),
						}
						: document
				)
			);
		}

		closeDocumentSettings();
	};

	const handleDeleteDocument = useCallback(() => {
		if (!settingsDocument || !isDeleteDocumentConfirmationValid) return;

		const deletedDocumentId = settingsDocument.id;
		const nextDocuments = documents.filter((document) => document.id !== deletedDocumentId);
		const nextSelectedDocumentId = resolveSelectedDocumentId(
			nextDocuments,
			selectedDocumentId === deletedDocumentId ? null : selectedDocumentId,
		);

		setDocuments(nextDocuments);
		setSelectedDocumentId(nextSelectedDocumentId);
		closeDocumentSettings();
	}, [closeDocumentSettings, documents, isDeleteDocumentConfirmationValid, selectedDocumentId, settingsDocument]);

	const handleDeleteDialogOpenChange = useCallback((open: boolean) => {
		setIsDeleteDocumentOpen(open);
		if (!open) setDeleteDocumentConfirmation("");
	}, []);

	useEffect(() => {
		const nextStorageKey = buildDocsStorageKey(activeWorkspaceId);
		const persistedState = readPersistedDocs(activeWorkspaceId);
		setDocuments(persistedState?.documents ?? INITIAL_DOCS);
		setSelectedDocumentId(persistedState?.selectedDocumentId ?? null);
		setHydratedStorageKey(nextStorageKey);
		setIsCreatingDocument(false);
		resetCreateComposerState();
		resetDocumentSettingsState();
	}, [activeWorkspaceId, resetCreateComposerState, resetDocumentSettingsState]);

	useEffect(() => {
		if (settingsDocumentId && !settingsDocument) {
			closeDocumentSettings();
		}
	}, [closeDocumentSettings, settingsDocument, settingsDocumentId]);

	useEffect(() => {
		if (hydratedStorageKey !== buildDocsStorageKey(activeWorkspaceId)) {
			return;
		}

		persistDocs(activeWorkspaceId, {
			documents,
			selectedDocumentId: resolvedSelectedDocumentId,
		});
	}, [activeWorkspaceId, documents, hydratedStorageKey, resolvedSelectedDocumentId]);

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
									<div
										key={document.id}
										className={styles["document-card"]}
										data-active={isActive ? "true" : "false"}
									>
										<button
											type="button"
											className={styles["document-card-main"]}
											onClick={() => handleSelectDocument(document.id)}
										>
											<div className={styles["document-card-title-row"]}>
												<span className={styles["document-card-title"]}>{document.title}</span>
												<span className={styles["document-card-meta"]}>{buildDocumentMeta(document)}</span>
											</div>
											{document.tag ? <span className={styles["document-card-tag"]}>{document.tag}</span> : null}
											<p className={styles["document-card-copy"]}>{buildDocumentPreview(document.content)}</p>
										</button>
										<button
											type="button"
											className={styles["document-card-settings"]}
											onClick={() => openDocumentSettings(document)}
											aria-label={`Manage ${document.title}`}
										>
											<Icon name="settings" size={15} />
										</button>
									</div>
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

									<DocumentTagEditor
										fieldLabel="Select purpose"
										fieldOptionalLabel="Choose one"
										customInputId="docs-document-tag"
										value={draftTag}
										onChange={setDraftTag}
									/>

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

			<DocumentSettingsDialog
				open={isSettingsOpen}
				document={settingsDocument}
				titleValue={settingsTitle}
				tagValue={settingsTag}
				canSave={canSaveSettings}
				onTitleChange={setSettingsTitle}
				onTagChange={setSettingsTag}
				onClose={closeDocumentSettings}
				onDeleteClick={() => setIsDeleteDocumentOpen(true)}
				onSubmit={handleSaveDocumentSettings}
			/>

			<DocumentDeleteDialog
				open={isDeleteDocumentOpen}
				documentTitle={settingsDocument?.title ?? null}
				confirmationValue={deleteDocumentConfirmation}
				isConfirmationValid={isDeleteDocumentConfirmationValid}
				onOpenChange={handleDeleteDialogOpenChange}
				onConfirmationChange={setDeleteDocumentConfirmation}
				onConfirm={handleDeleteDocument}
			/>
		</div>
	);
}
