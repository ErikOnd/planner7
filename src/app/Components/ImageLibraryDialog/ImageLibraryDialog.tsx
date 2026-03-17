"use client";

import styles from "./ImageLibraryDialog.module.scss";

import { Icon } from "@atoms/Icons/Icon";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { deleteUploadedImageById, getUploadedImagesOverview } from "../../../actions/upload-image";

type ImageLibraryDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	showLimitNotice?: boolean;
};

type ImageItem = {
	id: string;
	url: string;
	fileSize: number;
	mimeType: string;
	createdAt: string;
};

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string) {
	const date = new Date(value);
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function getDisplayFileName(url: string) {
	try {
		const pathname = new URL(url).pathname;
		const rawFileName = pathname.split("/").pop() ?? "image.webp";
		return decodeURIComponent(rawFileName).replace(/^\d+-/, "");
	} catch {
		return "image.webp";
	}
}

export function ImageLibraryDialog({ open, onOpenChange }: ImageLibraryDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
	const [images, setImages] = useState<ImageItem[]>([]);
	const [storageUsedBytes, setStorageUsedBytes] = useState(0);
	const [storageLimitBytes, setStorageLimitBytes] = useState(0);

	const loadImages = useCallback(async (options?: { silent?: boolean }) => {
		const silent = options?.silent === true;
		if (!silent) {
			setIsLoading(true);
		}
		setError(null);
		const result = await getUploadedImagesOverview();
		if (!result.success) {
			setError(result.error);
			setImages([]);
			setStorageUsedBytes(0);
			setStorageLimitBytes(0);
			setHasLoadedOnce(true);
			if (!silent) {
				setIsLoading(false);
			}
			return;
		}

		setImages(result.images);
		setStorageUsedBytes(result.storageUsedBytes);
		setStorageLimitBytes(result.storageLimitBytes);
		setHasLoadedOnce(true);
		if (!silent) {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!open) return;
		void loadImages();
	}, [open, loadImages]);

	const handleDeleteImage = async (id: string) => {
		if (isDeletingId) return;
		setIsDeletingId(id);

		const result = await deleteUploadedImageById(id);
		if (!result.success) {
			toast.error(result.error ?? "Failed to delete image.");
			setIsDeletingId(null);
			return;
		}

		await loadImages({ silent: true });
		setIsDeletingId(null);
	};

	const usagePercent = useMemo(() => {
		if (storageLimitBytes <= 0) return 0;
		return Math.min(100, Math.round((storageUsedBytes / storageLimitBytes) * 100));
	}, [storageLimitBytes, storageUsedBytes]);

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className={styles["image-library-overlay"]} />
				<Dialog.Content className={styles["image-library-dialog"]}>
					<header className={styles["image-library-header"]}>
						<div className={styles["image-library-title-row"]}>
							<div className={styles["image-library-heading"]}>
								<Dialog.Title className={styles["image-library-title"]}>Uploaded images</Dialog.Title>
								<div className={styles["image-library-storage"]}>
									<div className={styles["image-library-storage-text"]}>
										{formatBytes(storageUsedBytes)} used of {formatBytes(storageLimitBytes)}
									</div>
									<div className={styles["image-library-storage-bar"]} aria-hidden="true">
										<div
											className={styles["image-library-storage-bar-fill"]}
											style={{ width: `${usagePercent}%` }}
										/>
									</div>
								</div>
							</div>
							<Dialog.Close asChild>
								<button className={styles["image-library-close"]} aria-label="Close image library">
									<Icon name="close" size={24} />
								</button>
							</Dialog.Close>
						</div>
					</header>

					<div className={styles["image-library-content"]}>
						{isLoading && !hasLoadedOnce && <div className={styles["image-library-status"]}>Loading images...</div>}
						{!isLoading && error && (
							<div className={`${styles["image-library-status"]} ${styles["image-library-status--error"]}`}>
								{error}
							</div>
						)}
						{!isLoading && hasLoadedOnce && !error && images.length === 0 && (
							<div className={styles["image-library-status"]}>No uploaded images yet.</div>
						)}
						{!isLoading && !error && images.length > 0 && (
							<div className={styles["image-library-grid"]}>
								{images.map((image) => (
									<article key={image.id} className={styles["image-library-card"]}>
										<div className={styles["image-library-thumb-wrap"]}>
											<Image
												src={image.url}
												alt="Uploaded content preview"
												className={styles["image-library-thumb"]}
												fill
												sizes="(max-width: 640px) 45vw, 180px"
												unoptimized
											/>
										</div>
										<div className={styles["image-library-card-body"]}>
											<div className={styles["image-library-file-name"]} title={getDisplayFileName(image.url)}>
												{getDisplayFileName(image.url)}
											</div>
											<div className={styles["image-library-meta"]}>
												<span>{formatBytes(image.fileSize)}</span>
												<span aria-hidden="true">•</span>
												<span>{formatDate(image.createdAt)}</span>
											</div>
										</div>
										<div className={styles["image-library-card-footer"]}>
											<button
												type="button"
												className={styles["image-library-delete"]}
												disabled={isDeletingId === image.id}
												aria-label={`Delete ${getDisplayFileName(image.url)}`}
												onClick={() => {
													void handleDeleteImage(image.id);
												}}
											>
												<Icon name="trash" size={20} />
											</button>
										</div>
									</article>
								))}
							</div>
						)}
					</div>
					<footer className={styles["image-library-footer"]}>
						{!isLoading && !error && hasLoadedOnce
							? `Showing ${images.length} of ${images.length} images`
							: "\u00A0"}
					</footer>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
