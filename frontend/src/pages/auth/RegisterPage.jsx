import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AuthBackground from '../../components/auth/AuthBackground';
import ResponsiveHeader from '../../components/shared/ResponsiveHeader';
import api from '../../lib/api/api';
import {
  CPUT_CAMPUSES,
  RESIDENCE_OPTIONS,
  YEAR_OF_STUDY_OPTIONS,
} from '../../lib/config/domainOptions';
import {
  getDashboardPath,
  getToken,
  saveStoredUser,
} from '../../lib/utils/session';
import '../../styles/pages/auth/RegisterPage.css';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  studentNumber: '',
  course: '',
  campus: '',
  residence: '',
  yearOfStudy: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  password: '',
  confirmPassword: '',
};

function EyeIcon({ visible }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {visible && <path d="M4 4 20 20" />}
    </svg>
  );
}

function getRegistrationError(error) {
  if (!error.response) {
    return 'Unable to connect to PulseUp. Confirm that Spring Boot is running on port 8080.';
  }

  const data = error.response.data;
  const serverMessage =
    typeof data === 'string' ? data : data?.message || data?.error;

  if (serverMessage) return serverMessage;
  if (error.response.status === 400) {
    return 'The details were rejected. Check every field and ensure the email and student number are unique.';
  }
  if (error.response.status === 403) {
    return 'Student registration is currently unavailable.';
  }
  if (error.response.status === 409) {
    return 'That email address or student number is already registered.';
  }

  return error.response.status >= 500
    ? 'The server could not create the student account.'
    : 'Registration could not be completed.';
}

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const passwordsMatch = form.confirmPassword
    ? form.password === form.confirmPassword
    : null;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage('');
  }

  function validateForm() {
    if (Object.values(form).some((value) => !String(value).trim())) {
      return 'Please complete every required field.';
    }
    if (!/^[^\s@]+@mycput\.ac\.za$/i.test(form.email.trim())) {
      return 'Use your CPUT student email ending in @mycput.ac.za.';
    }
    if (!/^\d{8,12}$/.test(form.studentNumber.trim())) {
      return 'The student number must contain 8 to 12 digits.';
    }
    if (!/^0\d{9}$/.test(form.phoneNumber.trim())) {
      return 'Enter a valid 10-digit South African phone number.';
    }
    if (!/^0\d{9}$/.test(form.emergencyContactPhone.trim())) {
      return 'Enter a valid 10-digit emergency contact number.';
    }
    if (form.password.length < 8) {
      return 'Your password must contain at least 8 characters.';
    }
    if (form.password !== form.confirmPassword) {
      return 'The passwords do not match.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validateForm();

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/register/student', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        studentNumber: form.studentNumber.trim(),
        course: form.course.trim(),
        campus: form.campus,
        residence: form.residence,
        yearOfStudy: form.yearOfStudy,
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        password: form.password,
      });

      const user = saveStoredUser(response.data);

      if (!user || !getToken(user)) {
        throw new Error('REGISTRATION_TOKEN_MISSING');
      }

      navigate(getDashboardPath(user.role), { replace: true });
    } catch (error) {
      console.error(
        'Student registration failed:',
        error.response?.status,
        error.response?.data || error.message,
      );
      setMessage(
        error.message === 'REGISTRATION_TOKEN_MISSING'
          ? 'The backend created the account but did not return an authentication token.'
          : getRegistrationError(error),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="pulse-auth-page pulse-register-page">
      <AuthBackground />

      <section
        className="pulse-auth-card pulse-register-card"
        aria-label="PulseUp student registration"
      >
        <ResponsiveHeader
          variant="auth"
          ariaLabel="Registration page navigation"
          desktopAction={{ label: 'Back to home', to: '/' }}
          menuItems={[
            { label: 'Home', to: '/' },
            { label: 'Sign in', to: '/login' },
            {
              label: 'Create student account',
              to: '/register',
              active: true,
            },
          ]}
        />

        <div className="pulse-register-content">
          <div className="pulse-register-heading">
            <p className="pulse-auth-eyebrow">STUDENT REGISTRATION</p>
            <h1 className="pulse-auth-title">Create your account</h1>
            <span className="pulse-auth-lead">
              Complete your personal, academic and emergency-contact details.
            </span>
          </div>

          <form className="pulse-register-form" onSubmit={handleSubmit}>
            <fieldset className="pulse-register-section">
              <legend>Personal details</legend>
              <div className="pulse-register-section-grid">
                <label className="pulse-auth-field">
                  <span>First name</span>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={updateField}
                    autoComplete="given-name"
                    maxLength={100}
                    disabled={isSubmitting}
                    required
                  />
                </label>

                <label className="pulse-auth-field">
                  <span>Last name</span>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={updateField}
                    autoComplete="family-name"
                    maxLength={100}
                    disabled={isSubmitting}
                    required
                  />
                </label>

                <label className="pulse-auth-field">
                  <span>CPUT student email</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    autoComplete="email"
                    placeholder="studentnumber@mycput.ac.za"
                    pattern="[^@\s]+@mycput\.ac\.za"
                    title="Enter your @mycput.ac.za student email"
                    maxLength={150}
                    disabled={isSubmitting}
                    required
                  />
                  <small>Must end in @mycput.ac.za</small>
                </label>

                <label className="pulse-auth-field">
                  <span>Phone number</span>
                  <input
                    name="phoneNumber"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={updateField}
                    autoComplete="tel"
                    placeholder="0712345678"
                    pattern="0[0-9]{9}"
                    maxLength={10}
                    disabled={isSubmitting}
                    required
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="pulse-register-section">
              <legend>Academic details</legend>
              <div className="pulse-register-section-grid">
                <label className="pulse-auth-field">
                  <span>Student number</span>
                  <input
                    name="studentNumber"
                    value={form.studentNumber}
                    onChange={updateField}
                    inputMode="numeric"
                    pattern="[0-9]{8,12}"
                    maxLength={12}
                    disabled={isSubmitting}
                    required
                  />
                </label>

                <label className="pulse-auth-field">
                  <span>Course</span>
                  <input
                    name="course"
                    value={form.course}
                    onChange={updateField}
                    placeholder="e.g. Diploma in ICT"
                    maxLength={150}
                    disabled={isSubmitting}
                    required
                  />
                </label>

                <label className="pulse-auth-field">
                  <span>Campus</span>
                  <select
                    name="campus"
                    value={form.campus}
                    onChange={updateField}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Select campus</option>
                    {CPUT_CAMPUSES.map((campus) => (
                      <option value={campus} key={campus}>
                        {campus}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="pulse-auth-field">
                  <span>Residence</span>
                  <select
                    name="residence"
                    value={form.residence}
                    onChange={updateField}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Select residence</option>
                    {RESIDENCE_OPTIONS.map((residence) => (
                      <option value={residence} key={residence}>
                        {residence}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="pulse-auth-field pulse-register-wide-field">
                  <span>Year of study</span>
                  <select
                    name="yearOfStudy"
                    value={form.yearOfStudy}
                    onChange={updateField}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Select year of study</option>
                    {YEAR_OF_STUDY_OPTIONS.map((year) => (
                      <option value={year.value} key={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset className="pulse-register-section">
              <legend>Emergency contact</legend>
              <div className="pulse-register-section-grid">
                <label className="pulse-auth-field">
                  <span>Contact full name</span>
                  <input
                    name="emergencyContactName"
                    value={form.emergencyContactName}
                    onChange={updateField}
                    maxLength={100}
                    disabled={isSubmitting}
                    required
                  />
                </label>

                <label className="pulse-auth-field">
                  <span>Contact phone number</span>
                  <input
                    name="emergencyContactPhone"
                    type="tel"
                    value={form.emergencyContactPhone}
                    onChange={updateField}
                    placeholder="0712345678"
                    pattern="0[0-9]{9}"
                    maxLength={10}
                    disabled={isSubmitting}
                    required
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="pulse-register-section">
              <legend>Account security</legend>
              <div className="pulse-register-section-grid">
                <label className="pulse-auth-field">
                  <span>Password</span>
                  <div className="pulse-register-password">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={updateField}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      minLength={8}
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="pulse-register-eye"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={isSubmitting}
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                </label>

                <label className="pulse-auth-field">
                  <span>Confirm password</span>
                  <div
                    className={`pulse-register-password${
                      passwordsMatch === null
                        ? ''
                        : passwordsMatch
                          ? ' is-match'
                          : ' is-mismatch'
                    }`}
                  >
                    <input
                      name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={updateField}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      minLength={8}
                      aria-invalid={passwordsMatch === false}
                      aria-describedby="pulse-password-match"
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="pulse-register-eye"
                      aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
                      onClick={() => setShowConfirm((current) => !current)}
                      disabled={isSubmitting}
                    >
                      <EyeIcon visible={showConfirm} />
                    </button>
                  </div>
                  <small
                    id="pulse-password-match"
                    className={`pulse-register-match${
                      passwordsMatch === null
                        ? ''
                        : passwordsMatch
                          ? ' is-match'
                          : ' is-mismatch'
                    }`}
                    aria-live="polite"
                  >
                    {passwordsMatch === null
                      ? '\u00a0'
                      : passwordsMatch
                        ? '\u2713 Passwords match'
                        : '\u2717 Passwords do not match'}
                  </small>
                </label>
              </div>
            </fieldset>

            {message && (
              <p className="pulse-auth-message pulse-register-message" role="alert">
                {message}
              </p>
            )}

            <button
              className="pulse-auth-submit pulse-register-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create student account'}
            </button>
          </form>

          <p className="pulse-register-footer">
            Already registered?{' '}
            <Link className="pulse-auth-link" to="/login">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
