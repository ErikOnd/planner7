"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
	const { effectiveTheme, mounted } = useTheme();

	if (!mounted) return null;

	return (
		<ToastContainer
			position="bottom-right"
			autoClose={3500}
			hideProgressBar={false}
			newestOnTop={true}
			closeOnClick={true}
			pauseOnFocusLoss={true}
			draggable={true}
			pauseOnHover={true}
			theme={effectiveTheme}
		/>
	);
}
