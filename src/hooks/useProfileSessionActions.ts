"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function useProfileSessionActions() {
	const router = useRouter();
	const auth = useAuth();

	const handleLogout = async () => {
		await auth.signOut();
		router.push("/login");
	};

	const handleAccountDeleted = async () => {
		await auth.signOut();
		router.push("/signup");
	};

	return {
		handleLogout,
		handleAccountDeleted,
	};
}
