import { buildAppBootstrapPayload } from "@/lib/bootstrapPayload";
import { ensureWorkspaceSession } from "@/lib/workspaces";
import HomePage from "@components/Homepage/HomePage";
import { getCurrentWeek } from "@utils/getCurrentWeek";
import { createClient } from "@utils/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BootstrapHydrator } from "./BootstrapHydrator";

export const metadata: Metadata = {
	title: "Planner7 – Weekly Overview",
	description:
		"Plan your week with a rich text planning area for each day plus task tracking in one clear weekly overview.",
};

export default async function ProtectedPage() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getUser();

	if (error || !data?.user) {
		redirect("/login");
	}

	// Pre-fetch bootstrap data server-side to prime the client-side cache.
	// This eliminates the network round-trip that previously caused a loading
	// flash on every hard page load. Falls back to client-side bootstrap on error.
	let bootstrapProps: {
		payload: Awaited<ReturnType<typeof buildAppBootstrapPayload>>;
		startDate: string;
		endDate: string;
	} | null = null;
	try {
		const session = await ensureWorkspaceSession(data.user.id);
		const { days } = getCurrentWeek(new Date());
		const startDate = days[0].fullDate;
		const endDate = days[6].fullDate;

		const bootstrapData = await buildAppBootstrapPayload({
			userId: session.userId,
			workspaceId: session.activeWorkspaceId,
			activeWorkspaceId: session.activeWorkspaceId,
			startDate,
			endDate,
		});

		if (bootstrapData) {
			bootstrapProps = {
				payload: bootstrapData,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			};
		}
	} catch {
		// Fall back gracefully to client-side bootstrap.
	}

	if (bootstrapProps) {
		return (
			<BootstrapHydrator
				payload={bootstrapProps.payload!}
				startDate={bootstrapProps.startDate}
				endDate={bootstrapProps.endDate}
			>
				<HomePage />
			</BootstrapHydrator>
		);
	}

	return <HomePage />;
}
