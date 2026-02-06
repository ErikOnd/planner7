"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

type MagneticButtonProps = {
	children: ReactNode;
};

export function MagneticButton({ children }: MagneticButtonProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!ref.current) return;

		const rect = ref.current.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		const distanceX = e.clientX - centerX;
		const distanceY = e.clientY - centerY;

		setPosition({
			x: distanceX * 0.2,
			y: distanceY * 0.2,
		});
	};

	const handleMouseLeave = () => {
		setPosition({ x: 0, y: 0 });
	};

	return (
		<motion.div
			ref={ref}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			animate={{ x: position.x, y: position.y }}
			transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
			style={{ display: "inline-block" }}
		>
			{children}
		</motion.div>
	);
}
