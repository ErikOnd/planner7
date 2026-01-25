import { writeFileSync } from "fs";
import { resolve } from "path";
import pngToIco from "png-to-ico";

async function generateFavicon() {
	const iconPath = resolve("public/icon-192.png");
	const outputPath = resolve("src/app/favicon.ico");

	const buf = await pngToIco(iconPath);
	writeFileSync(outputPath, buf);

	console.log("✓ Generated favicon.ico");
}

generateFavicon().catch(console.error);
