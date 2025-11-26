"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
	mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "weekly-planner-theme";

/**
 * Get initial theme from localStorage or system preference
 */
function getInitialTheme(): Theme {
	if (typeof window === "undefined") return "light";

	const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
	if (storedTheme === "light" || storedTheme === "dark") {
		return storedTheme;
	}

	if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
		return "dark";
	}

	return "light";
}

/**
 * ThemeProvider component
 * Manages theme state and persists preference to localStorage
 * Applies theme by setting data-theme attribute on html element
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("light");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const initialTheme = getInitialTheme();
		setThemeState(initialTheme);
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;

		const root = document.documentElement;
		root.setAttribute("data-theme", theme);
		localStorage.setItem(THEME_STORAGE_KEY, theme);

		const metaThemeColor = document.querySelector("meta[name=\"theme-color\"]");
		if (metaThemeColor) {
			const color = theme === "dark" ? "#1a1a1a" : "#f9f8f4";
			metaThemeColor.setAttribute("content", color);
		}
	}, [theme, mounted]);

	useEffect(() => {
		if (!mounted) return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const handleChange = (e: MediaQueryListEvent) => {
			const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
			if (!storedTheme) {
				setThemeState(e.matches ? "dark" : "light");
			}
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
		<ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
			{children}
		</ThemeContext.Provider>
	);
}

/**
 * Hook to access theme context
 */
export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
