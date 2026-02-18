"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
	mounted: boolean;
	effectiveTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "planner7-theme";

function getInitialTheme(): Theme {
	if (typeof window === "undefined") return "system";

	const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
	if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
		return storedTheme;
	}

	return "system";
}

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("system");
	const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
	const [mounted, setMounted] = useState(false);

	const effectiveTheme = theme === "system" ? systemTheme : theme;

	useEffect(() => {
		const initialTheme = getInitialTheme();
		const initialSystemTheme = getSystemTheme();
		setThemeState(initialTheme);
		setSystemTheme(initialSystemTheme);
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;

		const root = document.documentElement;
		root.setAttribute("data-theme", effectiveTheme);
		localStorage.setItem(THEME_STORAGE_KEY, theme);

		const metaThemeColor = document.querySelector("meta[name=\"theme-color\"]");
		if (metaThemeColor) {
			const color = effectiveTheme === "dark" ? "#1a1a1a" : "#f5f1e8";
			metaThemeColor.setAttribute("content", color);
		}
	}, [effectiveTheme, theme, mounted]);

	useEffect(() => {
		if (!mounted) return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const handleChange = (e: MediaQueryListEvent) => {
			setSystemTheme(e.matches ? "dark" : "light");
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [mounted]);

	const toggleTheme = () => {
		setThemeState(prev => prev === "light" ? "dark" : "light");
	};

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted, effectiveTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
