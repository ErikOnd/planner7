import { BacklogProvider } from "@/contexts/BacklogContext";
import { NotesProvider } from "@/contexts/NotesContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { VoiceUsageProvider } from "@/contexts/VoiceUsageContext";
import { WeekDisplayProvider } from "@/contexts/WeekDisplayContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
	return (
		<WorkspaceProvider>
			<ProfileProvider>
				<BacklogProvider>
					<VoiceUsageProvider>
						<WeekDisplayProvider>
							<NotesProvider>{children}</NotesProvider>
						</WeekDisplayProvider>
					</VoiceUsageProvider>
				</BacklogProvider>
			</ProfileProvider>
		</WorkspaceProvider>
	);
}
