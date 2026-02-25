import type { Metadata } from "next";
import "./globals.scss";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import React, { ReactNode } from "react";
import ToastProvider from "./Providers/ToastProvider";

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
	title: "Planner7",
	description:
		"Planner7 is a weekly planner with a rich text planning area for each day plus tasks. Plan your work, not just check boxes.",
	applicationName: "Planner7",
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
			{ url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
		],
		shortcut: ["/favicon.ico"],
		apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
	},
	openGraph: {
		title: "Planner7",
		description:
			"Planner7 is a weekly planner with a rich text planning area for each day plus tasks. Plan your work, not just check boxes.",
		siteName: "Planner7",
		type: "website",
		images: [
			{
				url: "/icon-512.png",
				alt: "Planner7 logo",
			},
		],
	},
	twitter: {
		card: "summary",
		title: "Planner7",
		description:
			"Planner7 is a weekly planner with a rich text planning area for each day plus tasks. Plan your work, not just check boxes.",
		images: ["/icon-512.png"],
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Planner7",
	},
	manifest: "/manifest.json",
};

export default function RootLayout({ children }: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								try {
									const stored = localStorage.getItem('planner7-theme') || 'system';
									const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
									const theme = stored === 'system' ? systemTheme : stored;
									document.documentElement.setAttribute('data-theme', theme);
								} catch (e) {}
							})();
						`,
					}}
				/>
					<ThemeProvider>
						<ToastProvider />
						{children}
					</ThemeProvider>
					<SpeedInsights />
				</body>
		</html>
	);
}
