import type { Metadata } from "next";
import "@excalidraw/excalidraw/index.css";
import "./globals.scss";
import { AuthProvider } from "@/contexts/AuthContext";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { SpeedInsights } from "@vercel/speed-insights/next";
import React, { ReactNode } from "react";
import ToastProvider from "./Providers/ToastProvider";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: `${SITE_NAME} | Weekly Planner for Rich Daily Notes and Tasks`,
		template: `%s | ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	icons: {
		icon: [
			{ url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
			{ url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
			{ url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
			{ url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
			{ url: "/favicon.ico", sizes: "any" },
		],
		shortcut: ["/favicon.ico"],
		apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
	},
	openGraph: {
		title: `${SITE_NAME} | Weekly Planner for Rich Daily Notes and Tasks`,
		description: SITE_DESCRIPTION,
		siteName: SITE_NAME,
		type: "website",
		url: "/",
		images: [
			{
				url: "/icon-512.png",
				alt: `${SITE_NAME} logo`,
			},
		],
	},
	twitter: {
		card: "summary",
		title: `${SITE_NAME} | Weekly Planner for Rich Daily Notes and Tasks`,
		description: SITE_DESCRIPTION,
		images: ["/icon-512.png"],
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: SITE_NAME,
	},
	manifest: "/manifest.json",
};

export default function RootLayout({ children }: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<AuthProvider>
					<ToastProvider />
					{children}
				</AuthProvider>
				<SpeedInsights />
			</body>
		</html>
	);
}
