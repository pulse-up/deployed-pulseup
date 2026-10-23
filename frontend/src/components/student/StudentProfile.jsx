import {
    useCallback,
    useEffect,
    useState,
} from "react";
import ProfileImageUploader from '../shared/ProfileImageUploader';
import api from '../../lib/api/api';
import {
    CPUT_CAMPUSES,
    RESIDENCE_OPTIONS,
    YEAR_OF_STUDY_OPTIONS,
} from '../../lib/config/domainOptions';
import '../../styles/components/student/StudentProfile.css';

const EMPTY_PROFILE = {
    studentNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    course: "",
    campus: "",
    residence: "",
    yearOfStudy: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
};

const EMPTY_PASSWORD_FORM = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

function StudentProfile({
    imageUrl,
    onProfileUpdated,
    onPasswordChanged,
    onProfileImageChanged,
}) {
    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [passwordForm, setPasswordForm] = useState(
        EMPTY_PASSWORD_FORM,
    );
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordSuccessMessage, setPasswordSuccessMessage] =
        useState("");
    const [passwordErrorMessage, setPasswordErrorMessage] =
        useState("");

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage("");
            const response = await api.get("/students/me");
            setProfile({ ...EMPTY_PROFILE, ...response.data });
        } catch (error) {
            console.error("Student profile loading error:", {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });

            const status = error.response?.status;
            if (status === 401) {
                setErrorMessage(
                    "Your login session has expired. Sign out and sign in again.",
                );
            } else if (status === 403) {
                setErrorMessage(
                    "The backend security configuration is blocking access to your profile.",
                );
            } else if (status === 404) {
                setErrorMessage(
                    "No student record was found for the currently signed-in account.",
                );
            } else if (status === 500) {
                setErrorMessage(
                    "The backend failed while reading your student profile.",
                );
            } else if (!error.response) {
                setErrorMessage(
                    "Could not connect to the backend. Confirm that Spring Boot is running.",
                );
            } else {
                setErrorMessage(
                    `Could not load your profile. Server returned ${status}.`,
                );
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        window.queueMicrotask(() => {
            if (!cancelled) void loadProfile();
        });
        return () => {
            cancelled = true;
        };
    }, [loadProfile]);

    function handleChange(event) {
        const { name, value } = event.target;
        setProfile((currentProfile) => ({
            ...currentProfile,
            [name]: value,
        }));
        setSuccessMessage("");
        setErrorMessage("");
    }

    function handlePasswordChange(event) {
        const { name, value } = event.target;
        setPasswordForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
        setPasswordSuccessMessage("");
        setPasswordErrorMessage("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!/^[^\s@]+@mycput\.ac\.za$/i.test(profile.email.trim())) {
            setErrorMessage(
                "Use your CPUT student email ending in @mycput.ac.za.",
            );
            return;
        }
        if (!/^0\d{9}$/.test(profile.phoneNumber.trim())) {
            setErrorMessage(
                "Enter a valid 10-digit South African phone number.",
            );
            return;
        }
        if (
            !profile.course.trim() ||
            !profile.campus ||
            !profile.residence ||
            !profile.yearOfStudy
        ) {
            setErrorMessage("Complete all academic and residence fields.");
            return;
        }
        if (
            !profile.emergencyContactName?.trim() ||
            !/^0\d{9}$/.test(
                profile.emergencyContactPhone?.trim() || "",
            )
        ) {
            setErrorMessage(
                "Provide an emergency contact name and valid 10-digit phone number.",
            );
            return;
        }

        try {
            setSaving(true);
            setSuccessMessage("");
            setErrorMessage("");

            const response = await api.put("/students/me/profile", {
                firstName: profile.firstName.trim(),
                lastName: profile.lastName.trim(),
                email: profile.email.trim(),
                phoneNumber: profile.phoneNumber.trim(),
                course: profile.course.trim(),
                campus: profile.campus.trim(),
                residence: profile.residence,
                yearOfStudy: profile.yearOfStudy,
                emergencyContactName:
                    profile.emergencyContactName?.trim() || null,
                emergencyContactPhone:
                    profile.emergencyContactPhone?.trim() || null,
            });

            const updatedProfile = {
                ...EMPTY_PROFILE,
                ...response.data,
            };
            setProfile(updatedProfile);
            onProfileUpdated?.(response.data);
            setSuccessMessage(
                "Your profile was updated successfully.",
            );
        } catch (error) {
            console.error("Student profile update error:", {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });

            const status = error.response?.status;
            if (status === 400) {
                setErrorMessage(
                    "Complete all required fields before saving.",
                );
            } else if (status === 401) {
                setErrorMessage("Your login session has expired.");
            } else if (status === 403) {
                setErrorMessage(
                    "You are not authorised to update this profile.",
                );
            } else if (status === 404) {
                setErrorMessage(
                    "Your student record could not be found.",
                );
            } else {
                setErrorMessage("Your profile could not be updated.");
            }
        } finally {
            setSaving(false);
        }
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();
        const currentPassword = passwordForm.currentPassword;
        const newPassword = passwordForm.newPassword;

        if (!currentPassword) {
            setPasswordErrorMessage("Enter your current password.");
            return;
        }
        if (newPassword.length < 8) {
            setPasswordErrorMessage(
                "Your new password must be at least 8 characters.",
            );
            return;
        }
        if (newPassword !== passwordForm.confirmPassword) {
            setPasswordErrorMessage("The new passwords do not match.");
            return;
        }
        if (newPassword === currentPassword) {
            setPasswordErrorMessage(
                "Your new password must be different from your current password.",
            );
            return;
        }

        try {
            setChangingPassword(true);
            setPasswordSuccessMessage("");
            setPasswordErrorMessage("");
            await api.put("/students/me/password", {
                currentPassword,
                newPassword,
            });
            setPasswordForm(EMPTY_PASSWORD_FORM);
            setPasswordSuccessMessage(
                "Password changed. A fresh login is required; signing you out now.",
            );
            window.setTimeout(() => {
                onPasswordChanged?.();
            }, 900);
        } catch (error) {
            console.error("Student password update error:", {
                status: error.response?.status,
                message: error.message,
            });
            if (error.response?.status === 400) {
                setPasswordErrorMessage(
                    "The password could not be changed. Check your current password and choose a different password of at least 8 characters.",
                );
            } else if (error.response?.status === 401) {
                setPasswordErrorMessage(
                    "Your session is no longer valid. Sign in again.",
                );
            } else if (error.response?.status === 403) {
                setPasswordErrorMessage(
                    "You are not authorised to change this password.",
                );
            } else {
                setPasswordErrorMessage(
                    "Your password could not be changed. Please try again.",
                );
            }
        } finally {
            setChangingPassword(false);
        }
    }

    if (loading) {
        return (
            <article className="dashboard-panel profile-panel">
                <p>Loading your profile...</p>
            </article>
        );
    }

    return (
        <article className="dashboard-panel profile-panel">
            <div className="profile-heading">
                <div>
                    <p className="eyebrow">STUDENT PROFILE</p>
                    <h2>Personal information</h2>
                    <p>
                        Update your personal, academic and residence
                        information.
                    </p>
                </div>
                <div className="profile-student-number">
                    <span>STUDENT NUMBER</span>
                    <strong>
                        {profile.studentNumber || "Not available"}
                    </strong>
                </div>
            </div>

            <ProfileImageUploader
                hasProfileImage={Boolean(profile.hasProfileImage)}
                imageUrl={imageUrl}
                name={`${profile.firstName} ${profile.lastName}`.trim()}
                onChanged={(hasProfileImage) => {
                    setProfile((currentProfile) => ({
                        ...currentProfile,
                        hasProfileImage,
                    }));
                    onProfileImageChanged?.(hasProfileImage);
                }}
            />

            {successMessage && (
                <p className="profile-success-message">
                    {successMessage}
                </p>
            )}
            {errorMessage && (
                <p className="profile-error-message">{errorMessage}</p>
            )}

            <form className="profile-form" onSubmit={handleSubmit}>
                <label>
                    First name
                    <input type="text" name="firstName" value={profile.firstName} onChange={handleChange} required disabled={saving} />
                </label>
                <label>
                    Last name
                    <input type="text" name="lastName" value={profile.lastName} onChange={handleChange} required disabled={saving} />
                </label>
                <label>
                    Email address
                    <input type="email" name="email" value={profile.email} onChange={handleChange} required disabled={saving} />
                </label>
                <label>
                    Phone number
                    <input type="tel" name="phoneNumber" value={profile.phoneNumber} onChange={handleChange} required disabled={saving} />
                </label>
                <label>
                    Course
                    <input type="text" name="course" value={profile.course} onChange={handleChange} required disabled={saving} />
                </label>
                <label>
                    Campus
                    <select name="campus" value={profile.campus || ""} onChange={handleChange} required disabled={saving}>
                        <option value="">Select campus</option>
                        {CPUT_CAMPUSES.map((campus) => (
                            <option key={campus} value={campus}>{campus}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Residence
                    <select name="residence" value={profile.residence || ""} onChange={handleChange} required disabled={saving}>
                        <option value="">Select residence</option>
                        {RESIDENCE_OPTIONS.map((residence) => (
                            <option key={residence} value={residence}>{residence}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Year of study
                    <select name="yearOfStudy" value={profile.yearOfStudy || ""} onChange={handleChange} required disabled={saving}>
                        <option value="">Select year of study</option>
                        {YEAR_OF_STUDY_OPTIONS.map((yearOption) => (
                            <option key={yearOption.value} value={yearOption.value}>{yearOption.label}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Emergency contact name
                    <input type="text" name="emergencyContactName" value={profile.emergencyContactName || ""} onChange={handleChange} maxLength="100" required disabled={saving} />
                </label>
                <label>
                    Emergency contact phone
                    <input type="tel" name="emergencyContactPhone" value={profile.emergencyContactPhone || ""} onChange={handleChange} placeholder="0712345678" pattern="0[0-9]{9}" maxLength="10" required disabled={saving} />
                </label>
                <div className="profile-form-actions">
                    <button type="submit" className="primary-button" disabled={saving}>
                        {saving ? "Saving changes..." : "Save profile changes"}
                    </button>
                </div>
            </form>

            <section className="password-card" aria-labelledby="change-password-heading">
                <div className="password-card-heading">
                    <p className="eyebrow">ACCOUNT SECURITY</p>
                    <h2 id="change-password-heading">Change password</h2>
                    <p>
                        Changing your password invalidates your current session.
                        You will need to sign in again with the new password.
                    </p>
                </div>

                {passwordSuccessMessage && (
                    <p className="profile-success-message" role="status">
                        {passwordSuccessMessage}
                    </p>
                )}
                {passwordErrorMessage && (
                    <p className="profile-error-message" role="alert">
                        {passwordErrorMessage}
                    </p>
                )}

                <form className="password-form" onSubmit={handlePasswordSubmit}>
                    <label>
                        Current password
                        <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} autoComplete="current-password" required disabled={changingPassword} />
                    </label>
                    <label>
                        New password
                        <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} autoComplete="new-password" minLength="8" required disabled={changingPassword} />
                    </label>
                    <label>
                        Confirm new password
                        <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} autoComplete="new-password" minLength="8" required disabled={changingPassword} />
                    </label>
                    <div className="password-form-actions">
                        <button type="submit" className="primary-button" disabled={changingPassword || Boolean(passwordSuccessMessage)}>
                            {changingPassword ? "Changing password..." : "Change password"}
                        </button>
                    </div>
                </form>
            </section>
        </article>
    );
}

export default StudentProfile;
