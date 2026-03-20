import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Reset Password",
	description: "Reset your Planner7 account password.",
	robots: {
		index: false,
		follow: false,
	},
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
	return children;
}
