import { PUBLIC_SITE_PAGES, SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();

	return PUBLIC_SITE_PAGES.map((page) => ({
		url: `${SITE_URL}${page.path}`,
		lastModified,
		changeFrequency: page.changeFrequency,
		priority: page.priority,
	}));
}
