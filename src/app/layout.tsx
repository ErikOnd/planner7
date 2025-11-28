import type { Metadata } from "next";
import "./globals.scss";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TodosProvider } from "@/contexts/TodosContext";
import React, { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Weekly Planner",
	description: "A minimal weekly planner for scheduling, todos, and personal organization",
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
									const theme = localStorage.getItem('weekly-planner-theme') ||
										(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
									document.documentElement.setAttribute('data-theme', theme);
								} catch (e) {}
							})();
						`,
					}}
				/>
				<ThemeProvider>
					<TodosProvider>
						{children}
					</TodosProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
