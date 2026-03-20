const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteUrlWithProtocol = rawSiteUrl
	? rawSiteUrl.startsWith("http://") || rawSiteUrl.startsWith("https://")
		? rawSiteUrl
		: `https://${rawSiteUrl}`
	: null;

export const SITE_URL = siteUrlWithProtocol
	? siteUrlWithProtocol.replace(/\/+$/, "")
	: process.env.NODE_ENV === "production"
	? "https://planner7.com"
	: "http://localhost:3000";

export const SITE_NAME = "Planner7";
export const SITE_DESCRIPTION =
	"Planner7 is a focused weekly planner with rich daily notes, backlog task management, and one clear weekly view.";

export const MARKETING_NAV_LINKS = [
	{ href: "/features", label: "Features" },
	{ href: "/how-it-works", label: "How It Works" },
	{ href: "/faq", label: "FAQ" },
] as const;

export const PUBLIC_SITE_PAGES = [
	{ path: "/", changeFrequency: "weekly", priority: 1 },
	{ path: "/features", changeFrequency: "monthly", priority: 0.9 },
	{ path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
	{ path: "/faq", changeFrequency: "monthly", priority: 0.7 },
	{ path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
	{ path: "/terms", changeFrequency: "yearly", priority: 0.3 },
] as const;
