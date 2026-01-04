import type { Metadata } from "next";
import "./globals.scss";
import { NotesProvider } from "@/contexts/NotesContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TodosProvider } from "@/contexts/TodosContext";
import React, { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Planner7",
	description: "A minimal weekly planner for scheduling, todos, and personal organization",
	applicationName: "Planner7",
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
					<TodosProvider>
						<NotesProvider>
							{children}
						</NotesProvider>
					</TodosProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
