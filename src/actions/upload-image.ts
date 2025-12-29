"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@utils/supabase/server";

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

export async function uploadImage(formData: FormData): Promise<string> {
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();

	if (authError || !user) {
		throw new Error("Unauthorized");
	}

	const file = formData.get("file") as File;

	if (!file) {
		throw new Error("No file provided");
	}

	if (!file.type.startsWith("image/")) {
		throw new Error("File must be an image");
	}

	const MAX_FILE_SIZE = 1024 * 1024;
	if (file.size > MAX_FILE_SIZE) {
		throw new Error("File size must be less than 5MB");
	}

	const timestamp = Date.now();
	const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
	const fileName = `${user.id}/${timestamp}-${sanitizedFileName}`;

	const buffer = Buffer.from(await file.arrayBuffer());

	const uploadParams = {
		Bucket: BUCKET_NAME,
		Key: fileName,
		Body: buffer,
		ContentType: file.type,
		ACL: "public-read" as const,
	};

	await s3Client.send(new PutObjectCommand(uploadParams));

	return `${CDN_URL}/${fileName}`;
}
