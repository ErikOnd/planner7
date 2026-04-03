import Appearance from "@assets/icons/appearance.svg";
import ArrowDownRight from "@assets/icons/arrow-down-right.svg";
import Bug from "@assets/icons/bug.svg";
import Calendar from "@assets/icons/calendar.svg";
import ChevronDown from "@assets/icons/chevron-down.svg";
import ChevronLeft from "@assets/icons/chevron-left.svg";
import ChevronRight from "@assets/icons/chevron-right.svg";
import Clipboard from "@assets/icons/clipboard.svg";
import Close from "@assets/icons/close.svg";
import ClosedEye from "@assets/icons/closed-eye.svg";
import Connectors from "@assets/icons/connectors.svg";
import DoubleChevronLeft from "@assets/icons/double-chevron-left.svg";
import DoubleChevronRight from "@assets/icons/double-chevron-right.svg";
import Editor from "@assets/icons/editor.svg";
import Eye from "@assets/icons/eye.svg";
import Google from "@assets/icons/google.svg";
import Highlighter from "@assets/icons/highlighter.svg";
import Megaphone from "@assets/icons/megaphone.svg";
import Moon from "@assets/icons/moon.svg";
import NotebookPen from "@assets/icons/notebook-pen.svg";
import Notifications from "@assets/icons/notifications.svg";
import Password from "@assets/icons/password.svg";
import Pencil from "@assets/icons/pencil.svg";
import Plus from "@assets/icons/plus.svg";
import Preferences from "@assets/icons/preferences.svg";
import Profile from "@assets/icons/profile.svg";
import Questionmark from "@assets/icons/questionmark.svg";
import Redo from "@assets/icons/redo.svg";
import Send from "@assets/icons/send.svg";
import Settings from "@assets/icons/settings.svg";
import SignOut from "@assets/icons/sign-out.svg";
import SignOutSettings from "@assets/icons/signout-settings.svg";
import Star from "@assets/icons/star.svg";
import Storage from "@assets/icons/storage.svg";
import Sun from "@assets/icons/sun.svg";
import Trash from "@assets/icons/trash.svg";
import Undo from "@assets/icons/undo.svg";
import User from "@assets/icons/user.svg";
import Week from "@assets/icons/week.svg";

import clsx from "clsx";

const icons = {
	"appearance": Appearance,
	"palette": Appearance,
	"bug": Bug,
	"chevron-left": ChevronLeft,
	"chevron-right": ChevronRight,
	"chevron-down": ChevronDown,
	"plus": Plus,
	"questionmark": Questionmark,
	"redo": Redo,
	"settings": Settings,
	"sign-out": SignOut,
	"star": Star,
	"pencil": Pencil,
	"eye": Eye,
	"closed-eye": ClosedEye,
	"sun": Sun,
	"moon": Moon,
	"notebook-pen": NotebookPen,
	"planner": NotebookPen,
	"user": User,
	"profile": Profile,
	"general": Profile,
	"close": Close,
	"trash": Trash,
	"undo": Undo,
	"danger": Trash,
	"calendar": Calendar,
	"clipboard": Clipboard,
	"double-chevron-left": DoubleChevronLeft,
	"double-chevron-right": DoubleChevronRight,
	"google": Google,
	"Megaphone": Megaphone,
	"arrow-down-right": ArrowDownRight,
	"preferences": Preferences,
	"sliders-horizontal": Preferences,
	"send": Send,
	"connectors": Connectors,
	"workflow": Connectors,
	"password": Password,
	"lock-keyhole": Password,
	"notifications": Notifications,
	"bell": Notifications,
	"week": Week,
	"calendar-range": Week,
	"editor": Editor,
	"pencil-line": Editor,
	"highlighter": Highlighter,
	"storage": Storage,
	"image": Storage,
	"circle-user-round": Profile,
	"signout": SignOutSettings,
	"log-out": SignOutSettings,
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
