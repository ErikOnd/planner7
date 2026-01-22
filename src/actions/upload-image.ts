"use server";

import prisma from "@/lib/prisma";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@utils/supabase/server";
import sharp from "sharp";

const s3Client = new S3Client({
	endpoint: process.env.DIGITALOCEAN_SPACES_ENDPOINT,
	region: process.env.DIGITALOCEAN_SPACES_REGION,
	credentials: {
		accessKeyId: process.env.DIGITALOCEAN_SPACES_KEY || "",
		secretAccessKey: process.env.DIGITALOCEAN_SPACES_SECRET || "",
	},
});

const BUCKET_NAME = process.env.DIGITALOCEAN_SPACES_BUCKET || "";
const CDN_URL = process.env.DIGITALOCEAN_SPACES_CDN_URL || "";
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
	return await sharp(buffer)
		.resize(MAX_IMAGE_WIDTH, null, {
			fit: "inside",
			withoutEnlargement: true,
		})
		.webp({ quality: COMPRESSION_QUALITY })
		.toBuffer();
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

		const uploadParams = {
			Bucket: BUCKET_NAME,
			Key: fileName,
			Body: compressedBuffer,
			ContentType: "image/webp",
			ACL: "public-read" as const,
		};

		await s3Client.send(new PutObjectCommand(uploadParams));

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
		return { success: false, error: "Failed to upload image" };
	}
}
