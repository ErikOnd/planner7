"use server";

import prisma from "@/lib/prisma";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@utils/supabase/server";

const DO_ENDPOINT = process.env.DIGITALOCEAN_SPACES_ENDPOINT || "";
const DO_REGION = process.env.DIGITALOCEAN_SPACES_REGION || "";
const DO_KEY = process.env.DIGITALOCEAN_SPACES_KEY || "";
const DO_SECRET = process.env.DIGITALOCEAN_SPACES_SECRET || "";
const BUCKET_NAME = process.env.DIGITALOCEAN_SPACES_BUCKET || "";
const CDN_URL = process.env.DIGITALOCEAN_SPACES_CDN_URL || "";

const s3Client = new S3Client({
	endpoint: DO_ENDPOINT,
	region: DO_REGION,
	credentials: {
		accessKeyId: DO_KEY,
		secretAccessKey: DO_SECRET,
	},
});

const MAX_TOTAL_STORAGE = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1920;
const COMPRESSION_QUALITY = 85;

async function getUserStorageUsed(userId: string): Promise<number> {
	const result = await prisma.uploadedImage.aggregate({
		where: { userId },
		_sum: { fileSize: true },
	});

	return result._sum.fileSize || 0;
}

export async function getUserStorageInfo() {
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();

	if (authError || !user) {
		throw new Error("Unauthorized");
	}

	const usedBytes = await getUserStorageUsed(user.id);
	const usedMB = usedBytes / 1024 / 1024;
	const totalMB = MAX_TOTAL_STORAGE / 1024 / 1024;
	const remainingMB = totalMB - usedMB;
	const percentageUsed = (usedBytes / MAX_TOTAL_STORAGE) * 100;

	return {
		usedBytes,
		usedMB: Number(usedMB.toFixed(2)),
		totalMB,
		remainingMB: Number(remainingMB.toFixed(2)),
		percentageUsed: Number(percentageUsed.toFixed(1)),
	};
}

async function compressImage(buffer: Buffer): Promise<Buffer> {
	try {
		const sharpModule = await import("sharp");
		const sharp = sharpModule.default;
		return await sharp(buffer)
			.resize(MAX_IMAGE_WIDTH, null, {
				fit: "inside",
				withoutEnlargement: true,
			})
			.webp({ quality: COMPRESSION_QUALITY })
			.toBuffer();
	} catch (error) {
		console.error("Sharp unavailable, using original image buffer:", error);
		return buffer;
	}
}

async function ensureProfileExists(userId: string) {
	const existingProfile = await prisma.profile.findUnique({
		where: { id: userId },
		select: { id: true },
	});

	if (existingProfile) {
		return;
	}

	const supabase = await createClient();
	const { data: { user }, error } = await supabase.auth.getUser();
	if (error || !user || user.id !== userId) {
		throw new Error("Failed to resolve authenticated user for profile bootstrap");
	}

	const fallbackEmail = `${userId}@placeholder.local`;
	const displayName = (user.user_metadata?.displayName as string | undefined) ?? "";

	await prisma.profile.upsert({
		where: { id: userId },
		update: {},
		create: {
			id: userId,
			email: user.email ?? fallbackEmail,
			displayName,
		},
	});
}

export async function uploadImage(
	formData: FormData,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError || !user) {
			return { success: false, error: "Unauthorized" };
		}

		const file = formData.get("file") as File;

		if (!file) {
			return { success: false, error: "No file provided" };
		}

		if (!file.type.startsWith("image/")) {
			return { success: false, error: "File must be an image" };
		}

		await ensureProfileExists(user.id);

		const currentStorageUsed = await getUserStorageUsed(user.id);

		const timestamp = Date.now();
		const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.[^.]+$/, ".webp");
		const fileName = `${user.id}/${timestamp}-${sanitizedFileName}`;

		const originalBuffer = Buffer.from(await file.arrayBuffer());
		const compressedBuffer = await compressImage(originalBuffer);

		const compressedSize = compressedBuffer.length;

		if (currentStorageUsed + compressedSize > MAX_TOTAL_STORAGE) {
			const remainingMB = ((MAX_TOTAL_STORAGE - currentStorageUsed) / 1024 / 1024).toFixed(2);
			return { success: false, error: `Storage limit exceeded. You have ${remainingMB}MB remaining out of 5MB total.` };
		}

		if (!DO_ENDPOINT || !DO_REGION || !DO_KEY || !DO_SECRET || !BUCKET_NAME || !CDN_URL) {
			return {
				success: false,
				error: "DigitalOcean Spaces env vars are missing. Check DIGITALOCEAN_SPACES_* settings.",
			};
		}

		await s3Client.send(
			new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: fileName,
				Body: compressedBuffer,
				ContentType: "image/webp",
				ACL: "public-read",
			}),
		);

		const imageUrl = `${CDN_URL}/${fileName}`;

		await prisma.uploadedImage.create({
			data: {
				userId: user.id,
				url: imageUrl,
				key: fileName,
				fileSize: compressedSize,
				mimeType: "image/webp",
			},
		});

		return { success: true, url: imageUrl };
	} catch (error) {
		console.error("Upload error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to upload image",
		};
	}
}

export async function deleteUploadedImageByUrl(
	imageUrl: string,
): Promise<{ success: true } | { success: false; error: string }> {
	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			return { success: false, error: "Unauthorized" };
		}

		const image = await prisma.uploadedImage.findFirst({
			where: {
				userId: user.id,
				url: imageUrl,
			},
			select: {
				id: true,
				key: true,
			},
		});

		if (!image) {
			return { success: true };
		}

		if (!DO_ENDPOINT || !DO_REGION || !DO_KEY || !DO_SECRET || !BUCKET_NAME || !CDN_URL) {
			return {
				success: false,
				error: "DigitalOcean Spaces env vars are missing. Check DIGITALOCEAN_SPACES_* settings.",
			};
		}

		await s3Client.send(
			new DeleteObjectCommand({
				Bucket: BUCKET_NAME,
				Key: image.key,
			}),
		);

		await prisma.uploadedImage.delete({
			where: {
				id: image.id,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Delete upload error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to delete image",
		};
	}
}

export async function cleanupUnusedImages(): Promise<
	{ success: true; deleted: number } | { success: false; error: string }
> {
	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			return { success: false, error: "Unauthorized" };
		}

		if (!DO_ENDPOINT || !DO_REGION || !DO_KEY || !DO_SECRET || !BUCKET_NAME || !CDN_URL) {
			return {
				success: false,
				error: "DigitalOcean Spaces env vars are missing. Check DIGITALOCEAN_SPACES_* settings.",
			};
		}

		const candidates = await prisma.$queryRaw<Array<{ id: string; key: string }>>`
			SELECT ui.id, ui.key
			FROM "UploadedImage" ui
			WHERE ui."userId" = ${user.id}
				AND ui."createdAt" < (NOW() - INTERVAL '24 hours')
				AND NOT EXISTS (
					SELECT 1
					FROM "DailyNote" dn
					WHERE dn."userId" = ui."userId"
						AND dn.content::text ILIKE ('%' || ui.url || '%')
				)
		`;

		for (const image of candidates) {
			await s3Client.send(
				new DeleteObjectCommand({
					Bucket: BUCKET_NAME,
					Key: image.key,
				}),
			);
		}

		if (candidates.length > 0) {
			await prisma.uploadedImage.deleteMany({
				where: {
					id: { in: candidates.map((c) => c.id) },
					userId: user.id,
				},
			});
		}

		return { success: true, deleted: candidates.length };
	} catch (error) {
		console.error("Cleanup uploads error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to cleanup images",
		};
	}
}
