import { NotesProvider } from "@/contexts/NotesContext";
import { WeekDisplayProvider } from "@/contexts/WeekDisplayContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
	return (
		<WorkspaceProvider>
			<WeekDisplayProvider>
				<NotesProvider>{children}</NotesProvider>
			</WeekDisplayProvider>
		</WorkspaceProvider>
	);
}
