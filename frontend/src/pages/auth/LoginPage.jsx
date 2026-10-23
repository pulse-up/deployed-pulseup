import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AuthBackground from '../../components/auth/AuthBackground';
import ResponsiveHeader from '../../components/shared/ResponsiveHeader';
import api from '../../lib/api/api';
import {
  clearSession,
  getDashboardPath,
  getToken,
  saveStoredUser,
} from '../../lib/utils/session';
import '../../styles/pages/auth/LoginPage.css';

const INITIAL_FORM = { email: '', password: '' };
const INITIAL_RECOVERY = {
  email: '',
  studentNumber: '',
  phoneNumber: '',
  emergencyContactPhone: '',
  newPassword: '',
  confirmPassword: '',
};

const LockIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v2" /></svg>;
const MailIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m5 8 7 5 7-5" /></svg>;
function EyeIcon({ visible }) { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" /><circle cx="12" cy="12" r="2.5" />{visible && <path d="M4 4 20 20" />}</svg>; }

function getLoginError(error) {
  if (!error.response) return 'Could not connect to the PulseUp backend. Make sure Spring Boot is running on port 8080.';
  const data = error.response.data;
  const message = typeof data === 'string' ? data : data?.message || data?.error;
  switch (error.response.status) {
    case 400: return message || 'Enter a valid email address and password.';
    case 401: return message || 'The email address or password is incorrect.';
    case 403: return message || 'This account is inactive or is not allowed to sign in.';
    case 404: return message || 'No PulseUp account was found for this email address.';
    default: return error.response.status >= 500 ? message || 'The server could not complete your sign-in. Check the backend console.' : message || 'Sign-in could not be completed.';
  }
}

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(INITIAL_FORM);
  const [recovery, setRecovery] = useState(INITIAL_RECOVERY);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage('');
  }

  function updateRecovery(event) {
    const { name, value } = event.target;
    setRecovery((current) => ({ ...current, [name]: value }));
    setMessage('');
  }

  function showRecovery() {
    setRecovery((current) => ({ ...current, email: form.email }));
    setMode('recovery');
    setMessage('');
    setShowPassword(false);
  }

  function showLogin() {
    setMode('login');
    setMessage('');
    setShowPassword(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.email.trim() || !form.password) {
      setMessage('Enter your email address and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setMessage('Enter a valid email address.');
      return;
    }
    setMessage('');
    setMessageType('error');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      const user = saveStoredUser(response.data);
      if (!user || !getToken(user)) throw new Error('LOGIN_TOKEN_MISSING');
      const dashboardPath = getDashboardPath(user.role);
      if (dashboardPath === '/login') throw new Error('UNSUPPORTED_ROLE');
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      console.error('PulseUp login failed:', error.response?.status, error.response?.data || error.message);
      clearSession();
      if (error.message === 'LOGIN_TOKEN_MISSING') setMessage('The backend accepted the login but did not return an authentication token.');
      else if (error.message === 'UNSUPPORTED_ROLE') setMessage('The account has an unsupported role.');
      else setMessage(getLoginError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRecovery(event) {
    event.preventDefault();
    const {
      email,
      studentNumber,
      phoneNumber,
      emergencyContactPhone,
      newPassword,
      confirmPassword,
    } = recovery;

    if (!/^[^\s@]+@mycput\.ac\.za$/i.test(email.trim())) {
      setMessage('Enter your registered @mycput.ac.za student email.');
      return;
    }
    if (!/^\d{8,12}$/.test(studentNumber.trim())) {
      setMessage('Enter your registered student number.');
      return;
    }
    if (!/^0\d{9}$/.test(phoneNumber.trim()) || !/^0\d{9}$/.test(emergencyContactPhone.trim())) {
      setMessage('Enter both registered 10-digit phone numbers.');
      return;
    }
    if (newPassword.length < 8) {
      setMessage('Your new password must contain at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('The new passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage('');
      setMessageType('error');
      await api.post('/auth/student/password-recovery', {
        email: email.trim().toLowerCase(),
        studentNumber: studentNumber.trim(),
        phoneNumber: phoneNumber.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        newPassword,
      });
      clearSession();
      setForm({ email: email.trim().toLowerCase(), password: '' });
      setRecovery(INITIAL_RECOVERY);
      setMode('login');
      setMessageType('success');
      setMessage('Password changed. Sign in with your new password.');
    } catch (error) {
      console.error('Student password recovery failed:', error.response?.status);
      setMessageType('error');
      setMessage(
        error.response?.status === 400
          ? 'The supplied details do not match an active student account, or recovery is temporarily locked after repeated attempts.'
          : 'The password could not be changed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="pulse-auth-page pulse-login-page"><AuthBackground />
      <section className={`pulse-auth-card pulse-login-card${mode === 'recovery' ? ' is-recovery' : ''}`} aria-label={mode === 'login' ? 'PulseUp account sign in' : 'Student password recovery'}>
        <ResponsiveHeader variant="auth" showLogo={false} ariaLabel="Sign-in page navigation" desktopAction={{ label: 'Back to home', to: '/' }} menuItems={[{ label: 'Home', to: '/' }, { label: 'Sign in', to: '/login', active: true }, { label: 'Create student account', to: '/register' }]} />
        <div className="pulse-login-content">
          <div className="pulse-login-heading">
            <h1 className="pulse-auth-title">{mode === 'login' ? 'Sign in' : 'Reset student password'}</h1>
            <span className="pulse-auth-lead">{mode === 'login' ? 'Enter your email and password to continue.' : 'Verify the contact details already saved on your student profile.'}</span>
          </div>

          {mode === 'login' ? (
            <form className="pulse-login-form" onSubmit={handleSubmit}>
              <label className="pulse-auth-field pulse-login-field"><span>Email address</span><div className="pulse-login-input-wrapper"><i><MailIcon /></i><input type="email" name="email" value={form.email} onChange={updateField} autoComplete="email" placeholder="name@example.com" disabled={isSubmitting} required autoFocus /></div></label>
              <label className="pulse-auth-field pulse-login-field"><span>Password</span><div className="pulse-login-input-wrapper"><i><LockIcon /></i><input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={updateField} autoComplete="current-password" placeholder="Enter your password" disabled={isSubmitting} required /><button type="button" className="pulse-login-password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)} disabled={isSubmitting}><EyeIcon visible={showPassword} /></button></div></label>
              <button type="button" className="pulse-forgot-password" onClick={showRecovery} disabled={isSubmitting}>Forgot password?</button>
              {message && <p className={`pulse-auth-message${messageType === 'success' ? ' is-success' : ''}`} role={messageType === 'success' ? 'status' : 'alert'}>{message}</p>}
              <button type="submit" className="pulse-auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
            </form>
          ) : (
            <form className="pulse-recovery-form" onSubmit={handleRecovery}>
              <div className="pulse-recovery-grid">
                <label className="pulse-auth-field"><span>Student email</span><input type="email" name="email" value={recovery.email} onChange={updateRecovery} autoComplete="email" placeholder="student@mycput.ac.za" disabled={isSubmitting} required autoFocus /></label>
                <label className="pulse-auth-field"><span>Student number</span><input name="studentNumber" value={recovery.studentNumber} onChange={updateRecovery} inputMode="numeric" minLength="8" maxLength="12" disabled={isSubmitting} required /></label>
                <label className="pulse-auth-field"><span>Registered phone</span><input type="tel" name="phoneNumber" value={recovery.phoneNumber} onChange={updateRecovery} placeholder="0712345678" maxLength="10" disabled={isSubmitting} required /></label>
                <label className="pulse-auth-field"><span>Emergency contact phone</span><input type="tel" name="emergencyContactPhone" value={recovery.emergencyContactPhone} onChange={updateRecovery} placeholder="0712345678" maxLength="10" disabled={isSubmitting} required /></label>
                <label className="pulse-auth-field"><span>New password</span><input type={showPassword ? 'text' : 'password'} name="newPassword" value={recovery.newPassword} onChange={updateRecovery} autoComplete="new-password" minLength="8" disabled={isSubmitting} required /></label>
                <label className="pulse-auth-field"><span>Confirm password</span><input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={recovery.confirmPassword} onChange={updateRecovery} autoComplete="new-password" minLength="8" disabled={isSubmitting} required /></label>
              </div>
              <label className="pulse-recovery-show"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /><span>Show passwords</span></label>
              {message && <p className="pulse-auth-message" role="alert">{message}</p>}
              <div className="pulse-recovery-actions"><button type="button" onClick={showLogin} disabled={isSubmitting}>Back to sign in</button><button type="submit" className="pulse-auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Changing…' : 'Change password'}</button></div>
            </form>
          )}

          {mode === 'login' && <><div className="pulse-login-divider"><span>Don't have an account?</span></div><Link className="pulse-login-register" to="/register">Create a student account</Link></>}
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
