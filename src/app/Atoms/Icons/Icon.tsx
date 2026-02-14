import Calendar from "@assets/icons/calendar.svg";
import ChevronLeft from "@assets/icons/chevron-left.svg";
import ChevronRight from "@assets/icons/chevron-right.svg";
import Close from "@assets/icons/close.svg";
import ClosedEye from "@assets/icons/closed-eye.svg";
import DoubleChevronLeft from "@assets/icons/double-chevron-left.svg";
import DoubleChevronRight from "@assets/icons/double-chevron-right.svg";
import Eye from "@assets/icons/eye.svg";
import Google from "@assets/icons/google.svg";
import Megaphone from "@assets/icons/megaphone.svg";
import Moon from "@assets/icons/moon.svg";
import Pencil from "@assets/icons/pencil.svg";
import Plus from "@assets/icons/plus.svg";
import Questionmark from "@assets/icons/questionmark.svg";
import Settings from "@assets/icons/settings.svg";
import SignOut from "@assets/icons/sign-out.svg";
import Star from "@assets/icons/star.svg";
import Sun from "@assets/icons/sun.svg";
import Trash from "@assets/icons/trash.svg";
import User from "@assets/icons/user.svg";
import Microphone from "@assets/icons/microphone.svg";
import ArrowDownRight from "@assets/icons/arrow-down-right.svg";

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
	"trash": Trash,
	"calendar": Calendar,
	"double-chevron-left": DoubleChevronLeft,
	"double-chevron-right": DoubleChevronRight,
	"google": Google,
	"Megaphone": Megaphone,
	"Microphone": Microphone,
	"arrow-down-right": ArrowDownRight,
};

export type IconName = keyof typeof icons;

type IconProps = {
	name: IconName;
	size?: number | string;
	className?: string;
	ariaLabel?: string;
};

export function Icon({ name, size = 24, className, ariaLabel }: IconProps) {
	const IconComponent = icons[name];

	return (
		<IconComponent
			width={size}
			height={size}
			className={clsx("icon", className)}
			aria-label={ariaLabel}
			aria-hidden={!ariaLabel}
			role="img"
		/>
	);
}
