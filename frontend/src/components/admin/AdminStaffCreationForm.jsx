import { useState } from 'react';

import api from '../../lib/api/api';
import { STAFF_SERVICES } from '../../lib/config/domainOptions';
import '../../styles/components/admin/AdminStaffCreationForm.css';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  staffNumber: '',
  department: 'General Consultations',
  position: 'General Practitioner',
  specialization: 'Primary health care',
};

function AdminStaffCreationForm({ onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedService = STAFF_SERVICES.find(
    (service) => service.appointmentType === form.department,
  );
  const allowedPositions = selectedService?.positions || [];

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFeedback(null);
  }

  function handleDepartmentChange(event) {
    const department = event.target.value;
    const service = STAFF_SERVICES.find(
      (item) => item.appointmentType === department,
    );
    setForm((current) => ({
      ...current,
      department,
      position: service?.positions[0] || '',
      specialization: '',
    }));
    setFeedback(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFeedback({ type: 'error', text: 'Enter a valid email address.' });
      return;
    }
    if (!/^0\d{9}$/.test(form.phoneNumber.trim())) {
      setFeedback({
        type: 'error',
        text: 'Enter a valid 10-digit South African phone number.',
      });
      return;
    }
    if (!form.specialization.trim()) {
      setFeedback({
        type: 'error',
        text: "Enter the staff member's clinical specialization.",
      });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const response = await api.post('/auth/register/staff', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        staffNumber: form.staffNumber.trim(),
        department: form.department,
        position: form.position,
        specialization: form.specialization.trim(),
      });
      const createdStaff = response.data;
      if (!createdStaff?.userId) {
        throw new Error('The server did not return the created staff profile.');
      }

      await onCreated?.(createdStaff);
      setFeedback({
        type: 'success',
        text: `${createdStaff.firstName} ${createdStaff.lastName} was created for ${createdStaff.department} as ${createdStaff.position}.`,
      });
      setForm((current) => ({
        ...INITIAL_FORM,
        department: current.department,
        position: current.position,
        specialization: '',
      }));
    } catch (error) {
      console.error(
        'Staff account creation failed:',
        error.response?.status,
        error.response?.data || error.message,
      );
      const text =
        error.response?.status === 403
          ? 'Your session does not have permission to create clinic staff accounts.'
          : error.response?.status === 400
            ? 'Check that the email and staff number are unique and all clinic details are valid.'
            : 'The staff account could not be created. Please try again.';
      setFeedback({ type: 'error', text });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-staff-create" aria-labelledby="admin-staff-create-title">
      <header>
        <div>
          <p className="eyebrow">ACCOUNT MANAGEMENT</p>
          <h2 id="admin-staff-create-title">Create clinic staff account</h2>
          <p>Add a clinician and link the account to one supported clinic service.</p>
        </div>
        <span>ADMIN ONLY</span>
      </header>

      {feedback && (
        <p
          className={`admin-staff-create__feedback is-${feedback.type}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.text}
        </p>
      )}

      <form className="admin-staff-create__form" onSubmit={handleSubmit}>
        <label>
          First name
          <input name="firstName" value={form.firstName} onChange={handleFieldChange} disabled={submitting} required />
        </label>
        <label>
          Last name
          <input name="lastName" value={form.lastName} onChange={handleFieldChange} disabled={submitting} required />
        </label>
        <label>
          Staff number
          <input name="staffNumber" value={form.staffNumber} onChange={handleFieldChange} placeholder="e.g. 230126634" disabled={submitting} required />
        </label>
        <label>
          Email address
          <input type="email" name="email" value={form.email} onChange={handleFieldChange} disabled={submitting} required />
        </label>
        <label>
          Phone number
          <input type="tel" name="phoneNumber" value={form.phoneNumber} onChange={handleFieldChange} placeholder="0712345678" pattern="0[0-9]{9}" maxLength="10" disabled={submitting} required />
        </label>
        <label>
          Temporary password
          <input type="password" name="password" minLength="8" autoComplete="new-password" value={form.password} onChange={handleFieldChange} disabled={submitting} required />
        </label>
        <label>
          Department
          <select name="department" value={form.department} onChange={handleDepartmentChange} disabled={submitting}>
            {STAFF_SERVICES.map((service) => (
              <option value={service.appointmentType} key={service.appointmentType}>{service.appointmentType}</option>
            ))}
          </select>
        </label>
        <label>
          Position
          <select name="position" value={form.position} onChange={handleFieldChange} disabled={submitting} required>
            {allowedPositions.map((position) => (
              <option value={position} key={position}>{position}</option>
            ))}
          </select>
        </label>
        <label className="admin-staff-create__specialization">
          Clinical specialization
          <input name="specialization" value={form.specialization} onChange={handleFieldChange} placeholder="e.g. Primary health care" maxLength="150" disabled={submitting} required />
        </label>
        <div className="admin-staff-create__actions">
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create staff account'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default AdminStaffCreationForm;
