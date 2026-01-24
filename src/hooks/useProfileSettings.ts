import { useEffect, useState } from "react";
import { getUserProfile, updateUserPassword, updateUserProfile } from "../app/actions/profile";

export type ProfileData = {
	displayName: string;
	email: string;
	pendingEmail?: string;
};

export type ProfileFormData = {
	displayName: string;
	setDisplayName: (value: string) => void;
	email: string;
	setEmail: (value: string) => void;
};

export type PasswordFormData = {
	currentPassword: string;
	setCurrentPassword: (value: string) => void;
	newPassword: string;
	setNewPassword: (value: string) => void;
	confirmPassword: string;
	setConfirmPassword: (value: string) => void;
};

export type UIState = {
	isLoading: boolean;
	isSaving: boolean;
	isChangingPassword: boolean;
};

export type Messages = {
	error: string | null;
	successMessage: string | null;
	passwordError: string | null;
	passwordSuccessMessage: string | null;
};

export type ProfileActions = {
	hasChanges: boolean;
	handleSave: () => Promise<void>;
	handlePasswordChange: () => Promise<void>;
};

export function useProfileSettings() {
	const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);

	const hasChanges = Boolean(
		originalProfile
			&& (displayName !== originalProfile.displayName || email !== originalProfile.email),
	);

	useEffect(() => {
		const fetchProfile = async () => {
			setIsLoading(true);

			const { createClient } = await import("@utils/supabase/client");
			const supabase = createClient();
			await supabase.auth.refreshSession();

			const result = await getUserProfile();

			if (result.success && result.data) {
				setOriginalProfile(result.data);
				setDisplayName(result.data.displayName);
				setEmail(result.data.email);
			} else {
				setError(result.error || "Failed to load profile");
			}

			setIsLoading(false);
		};

		fetchProfile();
	}, []);

	const handleSave = async () => {
		if (!hasChanges) return;

		setIsSaving(true);
		setError(null);
		setSuccessMessage(null);

		const emailChanged = originalProfile && email !== originalProfile.email;

		const result = await updateUserProfile({
			displayName,
			email,
		});

		if (result.success && result.data) {
			setOriginalProfile(result.data);
			setDisplayName(result.data.displayName);
			setEmail(result.data.email);

			if (emailChanged) {
				setSuccessMessage(
					"A confirmation email has been sent to your new email address. Please check your inbox and confirm your new email.",
				);
			} else {
				setSuccessMessage("Profile updated successfully!");
			}
		} else {
			setError(result.error || "Failed to save profile");
		}

		setIsSaving(false);
	};

	const handlePasswordChange = async () => {
		setIsChangingPassword(true);
		setPasswordError(null);
		setPasswordSuccessMessage(null);

		// Validate passwords match
		if (newPassword !== confirmPassword) {
			setPasswordError("Passwords do not match");
			setIsChangingPassword(false);
			return;
		}

		const result = await updateUserPassword({
			currentPassword,
			newPassword,
		});

		if (result.success) {
			setPasswordSuccessMessage("Password updated successfully!");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} else {
			setPasswordError(result.error || "Failed to update password");
		}

		setIsChangingPassword(false);
	};

	const profileForm: ProfileFormData = {
		displayName,
		setDisplayName,
		email,
		setEmail,
	};

	const passwordForm: PasswordFormData = {
		currentPassword,
		setCurrentPassword,
		newPassword,
		setNewPassword,
		confirmPassword,
		setConfirmPassword,
	};

	const uiState: UIState = {
		isLoading,
		isSaving,
		isChangingPassword,
	};

	const messages: Messages = {
		error,
		successMessage,
		passwordError,
		passwordSuccessMessage,
	};

	const actions: ProfileActions = {
		hasChanges,
		handleSave,
		handlePasswordChange,
	};

	return {
		originalProfile,
		profileForm,
		passwordForm,
		uiState,
		messages,
		actions,
	};
}
