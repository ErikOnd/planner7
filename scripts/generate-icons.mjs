import { resolve } from "path";
import sharp from "sharp";

const iconPath = resolve("public/icon.svg");
const pngTargets = [
	{ path: resolve("public/icon-192.png"), size: 192 },
	{ path: resolve("public/icon-512.png"), size: 512 },
	{ path: resolve("public/apple-touch-icon.png"), size: 180 },
	{ path: resolve("src/app/icon.png"), size: 512 },
];

async function generateIcons() {
	console.log("Generating PWA icons...");

	for (const { path, size } of pngTargets) {
		await sharp(iconPath)
			.resize(size, size)
			.png()
			.toFile(path);

		console.log(`✓ Generated ${path}`);
	}

	console.log("Done! PWA icons generated successfully.");
}

generateIcons().catch(console.error);
