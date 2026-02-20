"use client";

import type { WorkspaceGradientPreset } from "@/lib/workspaceGradients";
import clsx from "clsx";

type GradientPickerProps = {
	idPrefix: string;
	selected: WorkspaceGradientPreset;
	presets: [WorkspaceGradientPreset, { from: string; to: string }][];
	onPick: (preset: WorkspaceGradientPreset) => void;
	className?: string;
	dotClassName: string;
	activeDotClassName: string;
};

export function GradientPicker({
	idPrefix,
	selected,
	presets,
	onPick,
	className,
	dotClassName,
	activeDotClassName,
}: GradientPickerProps) {
	return (
		<div className={className}>
			{presets.map(([key, gradient]) => (
				<button
					key={`${idPrefix}-${key}`}
					type="button"
					className={clsx(dotClassName, selected === key && activeDotClassName)}
					data-selected={selected === key}
					onClick={(event) => {
						event.stopPropagation();
						onPick(key);
					}}
					style={{
						background: `linear-gradient(145deg, ${gradient.from}, ${gradient.to})`,
					}}
					aria-pressed={selected === key}
					aria-label={`Set ${key} gradient`}
				/>
			))}
		</div>
	);
}
