import { useCallback, useEffect, useMemo, useState } from 'react';

import api from '../../lib/api/api';
import {
  downloadReferralLetter,
  printReferralLetter,
} from '../../lib/utils/referralLetterPdf';
import '../../styles/components/student/StudentSickNotes.css';

const EMPTY_FORM = {
  appointmentId: '',
  absenceStartDate: '',
  absenceEndDate: '',
  requestReason: '',
  referralRequested: false,
  referralRequestReason: '',
  referralConsentConfirmed: false,
};

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

function errorMessage(error, fallback) {
  const data = error?.response?.data;
  return typeof data === 'string' ? data : data?.message || fallback;
}

function isWithinDays(value, range) {
  if (range === 'ALL') return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - Number(range));
  return date >= cutoff;
}

function StudentSickNotes({ appointments = [] }) {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [consultationFilter, setConsultationFilter] = useState('ALL');
  const [recentFilter, setRecentFilter] = useState('ALL');
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/sick-notes/me');
      setNotes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Sick-note loading failed:', error);
      setMessage(errorMessage(error, 'Could not load your sick-note requests.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) void loadNotes();
    });
    return () => { cancelled = true; };
  }, [loadNotes]);

  const eligibleAppointments = useMemo(() => {
    const represented = new Set(notes.map((note) => String(note.appointmentId)));
    return appointments.filter(
      (appointment) =>
        appointment.status === 'COMPLETED' &&
        !represented.has(String(appointment.appointmentId)),
    );
  }, [appointments, notes]);

  const consultationTypes = useMemo(
    () => [...new Set(notes.map((note) => note.appointmentType).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second)),
    [notes],
  );
  const filteredNotes = useMemo(
    () => notes
      .filter((note) => {
        const statusMatches =
          statusFilter === 'ALL' ||
          String(note.status || '').toUpperCase() === statusFilter;
        const categoryMatches =
          categoryFilter === 'ALL' ||
          (categoryFilter === 'REFERRAL' && note.referralRequested) ||
          (categoryFilter === 'SICK_NOTE' && !note.referralRequested);
        const consultationMatches =
          consultationFilter === 'ALL' ||
          note.appointmentType === consultationFilter;
        return statusMatches && categoryMatches && consultationMatches && isWithinDays(note.createdAt, recentFilter);
      })
      .sort((first, second) =>
        String(second.createdAt || '').localeCompare(String(first.createdAt || '')),
      ),
    [categoryFilter, consultationFilter, notes, recentFilter, statusFilter],
  );

  function handleChange(event) {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'referralRequested' && !checked
        ? {
            referralRequestReason: '',
            referralConsentConfirmed: false,
          }
        : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (
      !form.appointmentId ||
      !form.absenceStartDate ||
      !form.absenceEndDate ||
      !form.requestReason.trim()
    ) {
      setMessage('Complete all sick-note request fields.');
      return;
    }
    if (form.absenceStartDate > form.absenceEndDate) {
      setMessage('The absence end date cannot be before the start date.');
      return;
    }
    if (
      form.referralRequested &&
      (form.referralRequestReason.trim().length < 10 ||
        !form.referralConsentConfirmed)
    ) {
      setMessage(
        'Explain the further assistance needed and confirm referral consent.',
      );
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      await api.post('/sick-notes', {
        appointmentId: Number(form.appointmentId),
        absenceStartDate: form.absenceStartDate,
        absenceEndDate: form.absenceEndDate,
        requestReason: form.requestReason.trim(),
        referralRequested: form.referralRequested,
        referralRequestReason: form.referralRequested
          ? form.referralRequestReason.trim()
          : null,
        referralConsentConfirmed:
          form.referralRequested && form.referralConsentConfirmed,
      });
      setForm(EMPTY_FORM);
      await loadNotes();
      setMessage(
        form.referralRequested
          ? 'Your sick-note and optional referral request were submitted to the assigned clinic staff.'
          : 'Your sick-note request was submitted for clinic staff review.',
      );
    } catch (error) {
      console.error('Sick-note submission failed:', error);
      setMessage(errorMessage(error, 'The sick-note request could not be submitted.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="student-sick-notes" aria-labelledby="clinic-letter-title">
      <div className="student-sick-notes__heading">
        <div>
          <p className="eyebrow">SICK NOTES</p>
          <h1 id="student-sick-notes-title">Request and track a clinic letter</h1>
          <p>Use a previous completed booking. Further hospital assistance is optional.</p>
        </div>
      </div>

      <section className="clinic-letter-banner" aria-label="How clinic letters work">
        <div className="clinic-letter-banner__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7V3Zm7 0v5h5M10 12h5m-5 4h5" /></svg>
        </div>
        <div className="clinic-letter-banner__copy">
          <p id="clinic-letter-title" className="eyebrow">DIGITAL CLINIC LETTER</p>
        </div>
        <ol className="clinic-letter-banner__steps">
          <li><span>1</span> Previous visit</li>
          <li><span>2</span> Clinic review</li>
          <li><span>3</span> Download PDF</li>
        </ol>
      </section>

      {message && <p className="dashboard-message student-sick-notes__message" role="status">{message}</p>}

      <div className="student-sick-notes__layout">
        <article className="dashboard-panel student-sick-notes__request-panel">
          <h2>New request</h2>
          <p className="student-sick-notes__intro">Select the completed consultation that supports this request.</p>
          <form className="booking-form" onSubmit={handleSubmit}>
            <label>
              Previous completed appointment
              <select name="appointmentId" value={form.appointmentId} onChange={handleChange} disabled={submitting || eligibleAppointments.length === 0} required>
                <option value="">{eligibleAppointments.length === 0 ? 'No eligible completed appointments' : 'Select an appointment'}</option>
                {eligibleAppointments.map((appointment) => (
                  <option value={appointment.appointmentId} key={appointment.appointmentId}>
                    {appointment.appointmentType} · {formatDate(appointment.slotDate)}
                  </option>
                ))}
              </select>
            </label>
            <div className="student-sick-notes__dates">
              <label>
                Absence start
                <input type="date" name="absenceStartDate" value={form.absenceStartDate} onChange={handleChange} disabled={submitting} required />
              </label>
              <label>
                Absence end
                <input type="date" name="absenceEndDate" min={form.absenceStartDate || undefined} value={form.absenceEndDate} onChange={handleChange} disabled={submitting} required />
              </label>
            </div>
            <label>
              Reason for sick-note request
              <textarea name="requestReason" value={form.requestReason} onChange={handleChange} maxLength={500} rows={4} disabled={submitting} required placeholder="Briefly explain the absence covered by this request" />
              <small>{form.requestReason.length}/500</small>
            </label>

            <label className="student-sick-notes__option">
              <input type="checkbox" name="referralRequested" checked={form.referralRequested} onChange={handleChange} disabled={submitting} />
              <span><strong>Request optional hospital referral</strong><small>Ask the assigned clinic staff for a signed letter to a verified facility in District Six or Cape Town.</small></span>
            </label>

            {form.referralRequested && (
              <div className="student-sick-notes__referral">
                <label>
                  Assistance requested
                  <textarea name="referralRequestReason" value={form.referralRequestReason} onChange={handleChange} minLength={10} maxLength={500} rows={3} disabled={submitting} required placeholder="Briefly describe the further assistance you are requesting" />
                  <small>{form.referralRequestReason.length}/500</small>
                </label>
                <label className="student-sick-notes__consent">
                  <input type="checkbox" name="referralConsentConfirmed" checked={form.referralConsentConfirmed} onChange={handleChange} disabled={submitting} required />
                  <span>I consent to the clinic including the minimum necessary information in a referral letter for the receiving healthcare facility.</span>
                </label>
              </div>
            )}

            <p className="student-sick-notes__safety">Not for emergencies. For severe or rapidly worsening symptoms, seek emergency care immediately or call 112 from a mobile phone or 10177 for an ambulance.</p>
            <button className="primary-button" type="submit" disabled={submitting || eligibleAppointments.length === 0}>
              {submitting ? 'Submitting...' : 'Submit request'}
            </button>
          </form>
        </article>

        <article className="dashboard-panel student-sick-notes__records-panel">
          <div className="student-sick-notes__records-heading">
            <div><p className="eyebrow">REQUEST HISTORY</p><h2>My clinic letters</h2></div>
            <span>{filteredNotes.length} shown</span>
          </div>
          <div className="sick-note-filters sick-note-filters--student">
            <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select></label>
            <label><span>Document</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="ALL">All documents</option><option value="SICK_NOTE">Sick notes</option><option value="REFERRAL">Referrals</option></select></label>
            <label><span>Consultation</span><select value={consultationFilter} onChange={(event) => setConsultationFilter(event.target.value)}><option value="ALL">All types</option>{consultationTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
            <label><span>Created</span><select value={recentFilter} onChange={(event) => setRecentFilter(event.target.value)}><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="ALL">All time</option></select></label>
            {(statusFilter !== 'ALL' || categoryFilter !== 'ALL' || consultationFilter !== 'ALL' || recentFilter !== 'ALL') && <button type="button" onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); setConsultationFilter('ALL'); setRecentFilter('ALL'); }}>Clear</button>}
          </div>
          {loading ? <p>Loading requests...</p> : filteredNotes.length === 0 ? (
            <p className="empty-message">No requests match these filters.</p>
          ) : (
            <div className="student-sick-notes__list">
              {filteredNotes.map((note) => {
                const expanded = selectedNoteId === note.sickNoteId;
                return (
                  <article className={`sick-note-card${expanded ? ' is-expanded' : ''}`} key={note.sickNoteId}>
                    <button type="button" className="sick-note-card__summary" aria-expanded={expanded} onClick={() => setSelectedNoteId((current) => current === note.sickNoteId ? null : note.sickNoteId)}>
                      <span><strong>{note.appointmentType}</strong><small>{formatDate(note.appointmentDate)} · {note.referralRequested ? 'Referral' : 'Sick note'}</small></span>
                      <span className={`sick-note-status ${String(note.status).toLowerCase()}`}>{note.status}</span>
                      <span className="sick-note-card__chevron" aria-hidden="true">⌄</span>
                    </button>
                    {expanded && (
                      <div className="sick-note-card__body">
                        <dl>
                          <div><dt>Absence period</dt><dd>{formatDate(note.absenceStartDate)} – {formatDate(note.absenceEndDate)}</dd></div>
                          <div><dt>Request</dt><dd>{note.requestReason}</dd></div>
                          <div><dt>Further referral</dt><dd>{note.referralRequested ? (note.letterAvailable ? `Issued for ${note.referralFacilityName}` : 'Requested — awaiting clinic staff decision') : 'Not requested'}</dd></div>
                          {note.reviewerComment && <div><dt>Clinic comment</dt><dd>{note.reviewerComment}</dd></div>}
                        </dl>
                        {note.letterAvailable && (
                          <div className="sick-note-card__downloads">
                            <button type="button" className="primary-button" onClick={() => downloadReferralLetter(note)}>Download PDF</button>
                            <button type="button" className="secondary-button" onClick={() => printReferralLetter(note)}>Print letter</button>
                          </div>
                        )}
                        {note.letterAvailable && <p className="sick-note-card__privacy">This document contains private health information. Store it securely and share it only with the intended healthcare provider.</p>}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default StudentSickNotes;
