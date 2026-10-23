import { useCallback, useEffect, useMemo, useState } from 'react';

import api from '../../lib/api/api';
import '../../styles/components/shared/SickNoteReviewPanel.css';

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

function formatDateTime(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
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

function SickNoteReviewPanel({ mode = 'staff', onPendingCountChange }) {
  const endpoint = mode === 'admin' ? '/sick-notes' : '/sick-notes/staff/me';
  const [notes, setNotes] = useState([]);
  const [reviewForms, setReviewForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [recentFilter, setRecentFilter] = useState('30');
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoint);
      const records = Array.isArray(response.data) ? response.data : [];
      setNotes(records);
      onPendingCountChange?.(
        records.filter((note) => note.status === 'PENDING').length,
      );
    } catch (error) {
      console.error('Sick-note review loading failed:', error);
      setMessage('Could not load sick-note requests.');
    } finally {
      setLoading(false);
    }
  }, [endpoint, onPendingCountChange]);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) void loadNotes();
    });
    return () => { cancelled = true; };
  }, [loadNotes]);

  const pendingCount = useMemo(
    () => notes.filter((note) => note.status === 'PENDING').length,
    [notes],
  );
  const filteredNotes = useMemo(
    () => notes.filter((note) => {
      const statusMatches = statusFilter === 'ALL' || note.status === statusFilter;
      const categoryMatches =
        categoryFilter === 'ALL' ||
        (categoryFilter === 'REFERRAL' && note.referralRequested) ||
        (categoryFilter === 'SICK_NOTE' && !note.referralRequested);
      return statusMatches && categoryMatches && isWithinDays(note.createdAt, recentFilter);
    }),
    [categoryFilter, notes, recentFilter, statusFilter],
  );

  function getReviewForm(noteId) {
    return {
      reviewerComment: '',
      signatureText: '',
      signatureConfirmed: false,
      referralFacilityName: '',
      referralFacilityAddress: '',
      referralFacilityContact: '',
      referralClinicalSummary: '',
      referralInstructions: '',
      ...(reviewForms[noteId] || {}),
    };
  }

  function updateReviewForm(noteId, name, value) {
    setReviewForms((current) => ({
      ...current,
      [noteId]: {
        ...getReviewForm(noteId),
        [name]: value,
      },
    }));
  }

  async function review(note, decision) {
    const form = getReviewForm(note.sickNoteId);
    const comment = form.reviewerComment.trim();

    if (!comment) {
      setMessage('A clinic confirmation or rejection comment is required.');
      return;
    }
    if (
      decision === 'APPROVED' &&
      (!form.signatureText.trim() || !form.signatureConfirmed)
    ) {
      setMessage('Enter your signature and confirm the clinical sign-off.');
      return;
    }
    if (
      decision === 'APPROVED' &&
      note.referralRequested &&
      (!form.referralFacilityName.trim() ||
        !form.referralFacilityAddress.trim() ||
        form.referralClinicalSummary.trim().length < 10)
    ) {
      setMessage(
        'Complete the receiving facility, address and clinical handover summary before signing.',
      );
      return;
    }

    try {
      setWorkingId(note.sickNoteId);
      setMessage('');
      await api.patch(`/sick-notes/${note.sickNoteId}/review`, {
        decision,
        reviewerComment: comment,
        signatureText: form.signatureText.trim(),
        signatureConfirmed: form.signatureConfirmed,
        referralFacilityName: form.referralFacilityName.trim(),
        referralFacilityAddress: form.referralFacilityAddress.trim(),
        referralFacilityContact: form.referralFacilityContact.trim(),
        referralClinicalSummary: form.referralClinicalSummary.trim(),
        referralInstructions: form.referralInstructions.trim(),
      });
      setReviewForms((current) => {
        const updated = { ...current };
        delete updated[note.sickNoteId];
        return updated;
      });
      await loadNotes();
      setMessage(
        decision === 'APPROVED'
          ? 'The signed clinic letter is now available to the student.'
          : 'The request was rejected with the clinic comment.',
      );
    } catch (error) {
      console.error('Sick-note review failed:', error);
      setMessage('The request could not be reviewed. Check all sign-off fields.');
    } finally {
      setWorkingId(null);
    }
  }

  function renderReviewForm(note, busy) {
    const form = getReviewForm(note.sickNoteId);

    return (
      <div className="sick-note-review-card__actions">
        <label className="sick-note-review-comment">
          Clinic confirmation or rejection comment {form.reviewerComment.length}/500
          <textarea
            value={form.reviewerComment}
            maxLength={500}
            rows={3}
            disabled={busy}
            onChange={(event) => updateReviewForm(note.sickNoteId, 'reviewerComment', event.target.value)}
            placeholder="Required: state the clinic decision or certified absence information"
          />
        </label>

        {note.referralRequested && (
          <fieldset className="sick-note-referral-fields">
            <legend>Hospital referral details</legend>
            <p>Use a facility whose details have been verified by the clinic. Do not promise admission or treatment.</p>
            <div>
              <label>
                Receiving hospital or facility
                <input value={form.referralFacilityName} maxLength={150} disabled={busy} onChange={(event) => updateReviewForm(note.sickNoteId, 'referralFacilityName', event.target.value)} required />
              </label>
              <label>
                Facility contact (optional)
                <input value={form.referralFacilityContact} maxLength={50} disabled={busy} onChange={(event) => updateReviewForm(note.sickNoteId, 'referralFacilityContact', event.target.value)} />
              </label>
            </div>
            <label>
              Verified facility address
              <input value={form.referralFacilityAddress} maxLength={300} disabled={busy} onChange={(event) => updateReviewForm(note.sickNoteId, 'referralFacilityAddress', event.target.value)} required />
            </label>
            <label>
              Minimum necessary clinical handover
              <textarea value={form.referralClinicalSummary} minLength={10} maxLength={1500} rows={4} disabled={busy} onChange={(event) => updateReviewForm(note.sickNoteId, 'referralClinicalSummary', event.target.value)} required placeholder="Relevant clinical findings and reason for further assistance" />
            </label>
            <label>
              Further instructions (optional)
              <textarea value={form.referralInstructions} maxLength={1000} rows={3} disabled={busy} onChange={(event) => updateReviewForm(note.sickNoteId, 'referralInstructions', event.target.value)} />
            </label>
          </fieldset>
        )}

        <fieldset className="sick-note-signature-fields">
          <legend>Electronic clinical sign-off</legend>
          <label>
            Type your full name as your signature
            <input value={form.signatureText} maxLength={150} disabled={busy} onChange={(event) => updateReviewForm(note.sickNoteId, 'signatureText', event.target.value)} placeholder="Full legal name" required />
          </label>
          <label className="sick-note-signature-confirmation">
            <input type="checkbox" checked={form.signatureConfirmed} disabled={busy} onChange={(event) => updateReviewForm(note.sickNoteId, 'signatureConfirmed', event.target.checked)} />
            <span>I confirm this information is clinically appropriate and I am authorised to issue this clinic letter.</span>
          </label>
        </fieldset>

        <div>
          <button type="button" className="complete-button" disabled={busy || !form.reviewerComment.trim()} onClick={() => review(note, 'APPROVED')}>{busy ? 'Signing…' : 'Approve and sign'}</button>
          <button type="button" className="danger-button" disabled={busy || !form.reviewerComment.trim()} onClick={() => review(note, 'REJECTED')}>Reject</button>
        </div>
      </div>
    );
  }

  function renderCard(note, canReview) {
    const busy = workingId === note.sickNoteId;
    const expanded = selectedNoteId === note.sickNoteId;

    return (
      <article
        className={`sick-note-review-card${expanded ? ' is-expanded' : ''}`}
        key={note.sickNoteId}
      >
        <button
          type="button"
          className="sick-note-review-card__summary"
          aria-expanded={expanded}
          onClick={() =>
            setSelectedNoteId((current) =>
              current === note.sickNoteId ? null : note.sickNoteId,
            )
          }
        >
          <span className="sick-note-review-card__identity">
            <strong>{note.studentName}</strong>
            <small>{note.studentNumber} · {note.appointmentType}</small>
          </span>
          <span className="sick-note-review-card__meta">
            {note.referralRequested ? 'Referral' : 'Sick note'} · {formatDateTime(note.createdAt)}
          </span>
          <span className={`sick-note-status ${String(note.status).toLowerCase()}`}>{note.status}</span>
          <span className="sick-note-review-card__chevron" aria-hidden="true">⌄</span>
        </button>

        {expanded && (
          <div className="sick-note-review-card__body">
            <div className="sick-note-review-card__details">
              <p><span>Previous consultation</span><strong>{formatDate(note.appointmentDate)}</strong></p>
              <p><span>Absence</span><strong>{formatDate(note.absenceStartDate)} – {formatDate(note.absenceEndDate)}</strong></p>
            </div>
            <p className="sick-note-review-card__reason"><strong>Request reason:</strong> {note.requestReason}</p>
            {note.referralRequested && (
              <div className="sick-note-review-card__referral-request">
                <strong>Optional hospital referral requested</strong>
                <p>{note.referralRequestReason}</p>
                <small>Student consent recorded for minimum-necessary information sharing.</small>
              </div>
            )}
            {note.reviewerComment && <p className="sick-note-review-card__reason"><strong>Clinic comment:</strong> {note.reviewerComment}</p>}
            {note.letterAvailable && (
              <div className="sick-note-review-card__issued">
                <strong>Signed clinic letter issued</strong>
                <span>{note.signerName} · {note.signerPosition} · {formatDate(note.signedAt?.slice(0, 10))}</span>
                {note.referralRequested && <span>Receiving facility: {note.referralFacilityName}</span>}
              </div>
            )}
            {canReview && note.status === 'PENDING' && renderReviewForm(note, busy)}
            {!canReview && note.status === 'PENDING' && (
              <p className="sick-note-review-card__admin-note">Assigned clinic staff review required.</p>
            )}
          </div>
        )}
      </article>
    );
  }

  const canReview = mode === 'staff';

  return (
    <section className={`sick-note-review sick-note-review--${mode}`} aria-labelledby={`${mode}-sick-note-title`}>
      <header className="sick-note-review__toolbar">
        <div>
          <h2 id={`${mode}-sick-note-title`}>{canReview ? 'Clinic letters' : 'Sick-note records'}</h2>
          <span>{pendingCount} pending · {filteredNotes.length} shown</span>
        </div>
        <div className="sick-note-filters">
          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
          <label>
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="ALL">All categories</option>
              <option value="SICK_NOTE">Sick notes</option>
              <option value="REFERRAL">Hospital referrals</option>
            </select>
          </label>
          <label>
            <span>Created</span>
            <select value={recentFilter} onChange={(event) => setRecentFilter(event.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="ALL">All time</option>
            </select>
          </label>
        </div>
      </header>

      {message && <p className="dashboard-message sick-note-review__message" role="status">{message}</p>}
      {loading ? (
        <p>Loading requests...</p>
      ) : filteredNotes.length === 0 ? (
        <p className="empty-message">No requests match these filters.</p>
      ) : (
        <div className="sick-note-review__list">
          {filteredNotes.map((note) => renderCard(note, canReview))}
        </div>
      )}
    </section>
  );
}

export default SickNoteReviewPanel;
