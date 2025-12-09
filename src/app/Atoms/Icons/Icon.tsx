import ChevronLeft from "@assets/icons/chevron-left.svg";
import ChevronRight from "@assets/icons/chevron-right.svg";
import Close from "@assets/icons/close.svg";
import ClosedEye from "@assets/icons/closed-eye.svg";
import Eye from "@assets/icons/eye.svg";
import Moon from "@assets/icons/moon.svg";
import Pencil from "@assets/icons/pencil.svg";
import Plus from "@assets/icons/plus.svg";
import Questionmark from "@assets/icons/questionmark.svg";
import Settings from "@assets/icons/settings.svg";
import SignOut from "@assets/icons/sign-out.svg";
import Star from "@assets/icons/star.svg";
import Sun from "@assets/icons/sun.svg";
import User from "@assets/icons/user.svg";

import clsx from "clsx";

const icons = {
	"chevron-left": ChevronLeft,
	"chevron-right": ChevronRight,
	"plus": Plus,
	"questionmark": Questionmark,
	"settings": Settings,
	"sign-out": SignOut,
	"star": Star,
	"pencil": Pencil,
	"eye": Eye,
	"closed-eye": ClosedEye,
	"sun": Sun,
	"moon": Moon,
	"user": User,
	"close": Close,
};

export type IconName = keyof typeof icons;

type IconProps = {
	name: IconName;
	size?: number | string;
	className?: string;
	ariaLabel?: string;
};

export function Icon({ name, size = 24, className, ariaLabel }: IconProps) {
	const Icon = icons[name];

	return (
		<Icon
			width={size}
			height={size}
			className={clsx("icon", className)}
			aria-label={ariaLabel}
			aria-hidden={!ariaLabel}
			role="img"
		/>
	);
}
