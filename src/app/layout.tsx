import type { Metadata } from "next";
import "./globals.scss";
import { NotesProvider } from "@/contexts/NotesContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TodosProvider } from "@/contexts/TodosContext";
import { WeekDisplayProvider } from "@/contexts/WeekDisplayContext";
import React, { ReactNode } from "react";
import ToastProvider from "./Providers/ToastProvider";

export const metadata: Metadata = {
	title: "Planner7",
	description: "A focused weekly planner that combines daily notes, tasks, and a week-at-a-glance view.",
	applicationName: "Planner7",
	icons: {
		icon: [
			{ url: "/app-icon.svg", type: "image/svg+xml" },
		],
		apple: [{ url: "/app-icon.svg", type: "image/svg+xml" }],
	},
	openGraph: {
		title: "Planner7",
		description: "A focused weekly planner that combines daily notes, tasks, and a week-at-a-glance view.",
		siteName: "Planner7",
		type: "website",
		images: [
			{
				url: "/app-icon.svg",
				alt: "Planner7 logo",
			},
		],
	},
	twitter: {
		card: "summary",
		title: "Planner7",
		description: "A focused weekly planner that combines daily notes, tasks, and a week-at-a-glance view.",
		images: ["/app-icon.svg"],
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
					<WeekDisplayProvider>
						<TodosProvider>
							<NotesProvider>
								{children}
							</NotesProvider>
						</TodosProvider>
					</WeekDisplayProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
