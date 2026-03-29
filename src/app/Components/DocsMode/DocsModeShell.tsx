"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@atoms/Button/Button";
import { Icon } from "@atoms/Icons/Icon";
import { Text } from "@atoms/Text/Text";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./DocsModeShell.module.scss";

type DocsDocument = {
	id: string;
	title: string;
	summary: string;
	lastEdited: string;
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

type PersistedDocsState = {
	documents: DocsDocument[];
	selectedDocumentId: string | null;
};

function buildDocsStorageKey(workspaceId: string | null) {
	return `${DOCS_STORAGE_KEY}:${workspaceId ?? "default"}`;
}

function readPersistedDocs(workspaceId: string | null): PersistedDocsState | null {
	if (typeof window === "undefined") return null;

	try {
		const raw = window.localStorage.getItem(buildDocsStorageKey(workspaceId));
		if (!raw) return null;

		const parsed = JSON.parse(raw) as Partial<PersistedDocsState> | null;
		if (!parsed || !Array.isArray(parsed.documents)) return null;

		return {
			documents: parsed.documents,
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

function buildDocumentSummary(tag?: string) {
	if (!tag) return "Fresh draft ready for the editor surface.";

	return `${tag} draft ready for the editor surface.`;
}

function buildDocument(title: string, tag?: string): DocsDocument {
	const trimmedTitle = title.trim();
	const trimmedTag = tag?.trim() || undefined;
	const normalizedId = trimmedTitle
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return {
		id: `${normalizedId || "untitled-document"}-${Date.now()}`,
		title: trimmedTitle,
		summary: buildDocumentSummary(trimmedTag),
		lastEdited: "Created just now",
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
							Create rich planning sheets here. Full Lexical editing, tables, and Excalidraw are coming next.
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
											<span className={styles["document-card-meta"]}>{document.lastEdited}</span>
										</div>
										{document.tag
											? <span className={styles["document-card-tag"]}>{document.tag}</span>
											: null}
										<p className={styles["document-card-copy"]}>{document.summary}</p>
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
						<div className={styles["document-paper-overlay"]} role="status" aria-live="polite">
							<div className={styles["document-paper-overlay-card"]}>
								<div className={styles["document-paper-illustration"]}>
									<div className={styles["document-paper-illustration-sheet"]}>
										<span className={styles["document-paper-illustration-line"]} />
										<span className={styles["document-paper-illustration-line"]} />
										<span className={styles["document-paper-illustration-line"]} />
										<span className={styles["document-paper-illustration-line"]} />
									</div>
									<div className={styles["document-paper-illustration-badge"]}>
										<Icon name="notebook-pen" size={28} />
									</div>
								</div>
								<h4 className={styles["document-paper-overlay-title"]}>Under construction</h4>
								<p className={styles["document-paper-overlay-copy"]}>
									This document surface is still being built out.
								</p>
							</div>
						</div>
					)
					: null}
			</section>
		</div>
	);
}
