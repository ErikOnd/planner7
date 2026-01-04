import { resolve } from "path";
import sharp from "sharp";

const sizes = [192, 512];
const iconPath = resolve("public/icon.svg");

async function generateIcons() {
	console.log("Generating PWA icons...");

	for (const size of sizes) {
		const outputPath = resolve("public", `icon-${size}.png`);

		await sharp(iconPath)
			.resize(size, size)
			.png()
			.toFile(outputPath);

		console.log(`✓ Generated ${outputPath}`);
	}

	console.log("Done! PWA icons generated successfully.");
}

generateIcons().catch(console.error);
