export const WORKSPACE_GRADIENTS = {
	violet: { from: "#4f46e5", to: "#7c3aed" },
	amber: { from: "#f59e0b", to: "#d97706" },
	ocean: { from: "#0ea5e9", to: "#2563eb" },
	emerald: { from: "#10b981", to: "#059669" },
	rose: { from: "#f43f5e", to: "#e11d48" },
	slate: { from: "#64748b", to: "#334155" },
} as const;

export type WorkspaceGradientPreset = keyof typeof WORKSPACE_GRADIENTS;

export function isWorkspaceGradientPreset(value: string): value is WorkspaceGradientPreset {
	return value in WORKSPACE_GRADIENTS;
}
