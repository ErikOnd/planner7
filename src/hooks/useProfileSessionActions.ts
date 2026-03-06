"use client";

import { useAuth } from "@/contexts/AuthContext";
import { clearAppBootstrapCache } from "@/lib/clientBootstrap";
import { useRouter } from "next/navigation";

export function useProfileSessionActions() {
	const router = useRouter();
	const auth = useAuth();

	const handleLogout = async () => {
		await auth.signOut();
		clearAppBootstrapCache();
		router.push("/login");
	};

	const handleAccountDeleted = async () => {
		await auth.signOut();
		clearAppBootstrapCache();
		router.push("/signup");
	};

	return {
		handleLogout,
		handleAccountDeleted,
	};
}
