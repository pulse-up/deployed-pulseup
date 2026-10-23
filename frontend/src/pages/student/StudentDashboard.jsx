import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import HealthRewards from '../../components/student/HealthRewards';
import DashboardSidebar from '../../components/shared/DashboardSidebar';
import StudentProfile from '../../components/student/StudentProfile';
import StudentSickNotes from '../../components/student/StudentSickNotes';
import ResponsiveHeader from '../../components/shared/ResponsiveHeader';
import useProfileImage from '../../lib/hooks/useProfileImage';
import { studentNotifications } from '../../lib/utils/dashboardNotifications';
import api from '../../lib/api/api';
import {
  clearSession,
  getStoredUser,
  getToken,
  normalizeRole,
  saveStoredUser,
} from '../../lib/utils/session';

import '../../styles/pages/student/StudentDashboard.css';

const APPOINTMENT_TYPES = [
  'General Consultations',
  'Reproductive Health',
  'HIV VCT',
  'TB DOTS',
  'Wound Dressings',
];
const APPOINTMENT_SERVICE_DESCRIPTIONS = {
  'General Consultations': 'Primary care, check-ups and minor illness.',
  'Reproductive Health': 'Sexual and reproductive health support.',
  'HIV VCT': 'Confidential counselling and testing.',
  'TB DOTS': 'Treatment support and adherence visits.',
  'Wound Dressings': 'Acute and chronic wound care.',
};
const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'RESCHEDULED'];
const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

function StudentActionIcon({ type }) {
  const paths = {
    booking: 'M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm7 4v6m-3-3h6',
    rewards: 'm12 3 2.1 4.25 4.7.68-3.4 3.32.8 4.68L12 14.7l-4.2 2.23.8-4.68-3.4-3.32 4.7-.68L12 3Z',
    profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0',
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[type]} /></svg>;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-ZA', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      }).format(date);
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : 'Time unavailable';
}

function formatSlot(slot) {
  return `${formatDate(slot.slotDate)} · ${formatTime(slot.startTime)} – ${formatTime(slot.endTime)} · ${slot.roomNumber || 'Room to be assigned'}`;
}

function todayValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;
  const serverMessage =
    typeof data === 'string' ? data : data?.message || data?.error;

  if (
    error?.response?.status >= 500 ||
    serverMessage === 'Internal Server Error'
  ) {
    return fallback;
  }

  return serverMessage || fallback;
}

async function fetchDashboardData(appointmentType) {
  const [profileResponse, allSlotsResponse, bookingSlotsResponse, appointmentsResponse] = await Promise.all([
    api.get('/students/me'),
    api.get('/time-slots'),
    api.get('/time-slots', { params: { appointmentType } }),
    api.get('/appointments/my-queue'),
  ]);
  return {
    studentProfile: profileResponse.data || {},
    allTimeSlots: toArray(allSlotsResponse.data),
    bookingSlots: toArray(bookingSlotsResponse.data),
    appointments: toArray(appointmentsResponse.data),
  };
}

function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser() || {});
  const [studentProfile, setStudentProfile] = useState({});
  const [dashboardSection, setDashboardSection] = useState('overview');
  const [allTimeSlots, setAllTimeSlots] = useState([]);
  const [bookingSlots, setBookingSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [appointmentType, setAppointmentType] = useState('General Consultations');
  const [notes, setNotes] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileImageVersion, setProfileImageVersion] = useState(0);

  const userRole = normalizeRole(user.role);
  const userToken = getToken(user);

  const applyProfile = useCallback((profile) => {
    if (!profile) return;
    setStudentProfile(profile);
    setUser((current) => {
      const updated = { ...current, ...profile, token: getToken(current), role: current.role || 'STUDENT' };
      return saveStoredUser(updated) || updated;
    });
  }, []);

  const refreshDashboardData = useCallback(async () => {
    try {
      const data = await fetchDashboardData(appointmentType);
      applyProfile(data.studentProfile);
      setAllTimeSlots(data.allTimeSlots);
      setBookingSlots(data.bookingSlots);
      setAppointments(data.appointments);
      return true;
    } catch (error) {
      console.error('Student dashboard loading failed:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearSession();
        navigate('/login', { replace: true });
        return false;
      }
      setMessage(getErrorMessage(error, 'Could not load your dashboard information.'));
      return false;
    }
  }, [appointmentType, applyProfile, navigate]);

  useEffect(() => {
    if (!userToken || userRole !== 'STUDENT') {
      navigate('/login', { replace: true });
      return undefined;
    }
    let cancelled = false;
    window.queueMicrotask(async () => {
      if (cancelled) return;
      setLoading(true);
      setMessage('');
      await refreshDashboardData();
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [navigate, refreshDashboardData, userRole, userToken]);

  useEffect(() => {
    if (!userToken || userRole !== 'STUDENT') return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshDashboardData();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [refreshDashboardData, userRole, userToken]);

  const availableSlots = useMemo(
    () => bookingSlots.filter((slot) => slot.available === true),
    [bookingSlots],
  );
  const activeAppointments = useMemo(
    () => appointments.filter((appointment) => ACTIVE_STATUSES.includes(appointment.status)),
    [appointments],
  );
  const historyAppointments = useMemo(
    () => appointments.filter((appointment) => TERMINAL_STATUSES.includes(appointment.status)),
    [appointments],
  );
  const confirmedAppointments = useMemo(
    () => activeAppointments.filter((appointment) => appointment.status === 'CONFIRMED'),
    [activeAppointments],
  );
  const sortedActiveAppointments = useMemo(
    () => [...activeAppointments].sort((a, b) => `${a.slotDate || ''}T${a.startTime || ''}`.localeCompare(`${b.slotDate || ''}T${b.startTime || ''}`)),
    [activeAppointments],
  );
  const liveQueueAppointment = useMemo(
    () => confirmedAppointments.find((appointment) => appointment.slotDate === todayValue()) || null,
    [confirmedAppointments],
  );
  const healthPoints = Math.max(0, Number(studentProfile.healthPoints ?? user.healthPoints ?? 0) || 0);

  const appointmentTabs = [
    ['all', 'All active'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['rescheduled', 'Rescheduled'],
  ];
  const historyConsultationTypes = useMemo(
    () => [...new Set(historyAppointments.map((appointment) => appointment.appointmentType).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second)),
    [historyAppointments],
  );
  const visibleActive = activeTab === 'all'
    ? sortedActiveAppointments
    : sortedActiveAppointments.filter((appointment) => appointment.status === activeTab.toUpperCase());
  const visibleHistory = useMemo(
    () => historyAppointments
      .filter((appointment) => {
        const statusMatches = historyFilter === 'all' || appointment.status === historyFilter.toUpperCase();
        const typeMatches = historyTypeFilter === 'ALL' || appointment.appointmentType === historyTypeFilter;
        const fromMatches = !historyDateFrom || Boolean(appointment.slotDate && appointment.slotDate >= historyDateFrom);
        const toMatches = !historyDateTo || Boolean(appointment.slotDate && appointment.slotDate <= historyDateTo);
        return statusMatches && typeMatches && fromMatches && toMatches;
      })
      .sort((first, second) =>
        `${second.slotDate || ''}T${second.startTime || ''}`.localeCompare(
          `${first.slotDate || ''}T${first.startTime || ''}`,
        ),
      ),
    [historyAppointments, historyDateFrom, historyDateTo, historyFilter, historyTypeFilter],
  );

  function selectSection(section) {
    setMessage('');
    setDashboardSection(section);
  }

  function getRescheduleOptions(appointment) {
    return allTimeSlots.filter((slot) => slot.available === true && slot.appointmentType === appointment.appointmentType && String(slot.slotId) !== String(appointment.slotId));
  }

  async function handleBooking(event) {
    event.preventDefault();
    if (!selectedSlotId) { setMessage('Please select an available time slot.'); return; }
    try {
      setSubmitting(true); setMessage('');
      await api.post('/appointments', null, { params: { slotId: Number(selectedSlotId), notes: notes.trim() || undefined } });
      setSelectedSlotId(''); setNotes(''); setActiveTab('all');
      await refreshDashboardData();
      setMessage('Your appointment was booked and is awaiting staff confirmation.');
    } catch (error) {
      setMessage(getErrorMessage(error, 'The appointment could not be booked. The selected slot may no longer be available.'));
    } finally { setSubmitting(false); }
  }

  async function handleCancellation(appointmentId) {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      setSubmitting(true); setMessage('');
      await api.patch(`/appointments/${appointmentId}/cancel`);
      await refreshDashboardData();
      setHistoryFilter('cancelled');
      setHistoryTypeFilter('ALL');
      setHistoryDateFrom('');
      setHistoryDateTo('');
      setDashboardSection('history');
      setMessage('Your appointment was cancelled successfully.');
    } catch (error) {
      setMessage(getErrorMessage(error, 'The appointment could not be cancelled.'));
    } finally { setSubmitting(false); }
  }

  async function handleReschedule(appointmentId) {
    const slotId = rescheduleSlots[appointmentId];
    if (!slotId) { setMessage('Select a new available time slot first.'); return; }
    try {
      setSubmitting(true); setMessage('');
      await api.patch(`/appointments/${appointmentId}/reschedule`, null, { params: { slotId: Number(slotId) } });
      setRescheduleSlots((current) => ({ ...current, [appointmentId]: '' }));
      setActiveTab('rescheduled');
      await refreshDashboardData();
      setMessage('Your appointment was rescheduled successfully.');
    } catch (error) {
      setMessage(getErrorMessage(error, 'The appointment could not be rescheduled.'));
    } finally { setSubmitting(false); }
  }

  function handleLogout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  function renderQueueCard() {
    if (!liveQueueAppointment) {
      return (
        <article className="live-queue-card queue-empty-card" aria-label="Live digital queue">
          <div className="queue-card-heading"><div><p className="queue-card-label">LIVE DIGITAL QUEUE</p><h2>No active queue today</h2></div><span className="queue-live-badge queue-live-badge--waiting">QUEUE</span></div>
          <div className="queue-card-content"><div className="queue-number queue-number--empty"><strong>--</strong><span>IN QUEUE</span></div><div className="queue-information-grid"><div><span>ASSISTING CLINICIAN</span><strong>Not assigned</strong></div><div><span>ESTIMATED WAIT</span><strong>Not available</strong></div><div><span>CLINIC ROOM</span><strong>Not available</strong></div><div><span>STATUS</span><strong>No confirmed visit today</strong></div></div></div>
          <p className="queue-card-footer">Only a confirmed appointment scheduled for today appears in the live queue.</p>
        </article>
      );
    }
    return (
      <article className="live-queue-card" aria-label="Live digital queue">
        <div className="queue-card-heading"><div><p className="queue-card-label">LIVE DIGITAL QUEUE</p><h2>{liveQueueAppointment.appointmentType}</h2></div><span className="queue-live-badge"><i aria-hidden="true" /> LIVE NOW</span></div>
        <div className="queue-card-content"><div className="queue-number"><strong>#{liveQueueAppointment.queuePosition || 1}</strong><span>IN QUEUE</span></div><div className="queue-information-grid"><div><span>ASSISTING CLINICIAN</span><strong>{liveQueueAppointment.staffName || 'Assigned after confirmation'}</strong></div><div><span>ESTIMATED WAIT</span><strong>{liveQueueAppointment.estimatedWaitMinutes || 0} minutes</strong></div><div><span>CLINIC ROOM</span><strong>{liveQueueAppointment.roomNumber || 'To be assigned'}</strong></div><div><span>STATUS</span><strong>Confirmed</strong></div></div></div>
        <p className="queue-card-footer"><span>{formatDate(liveQueueAppointment.slotDate)}</span><span>{formatTime(liveQueueAppointment.startTime)} – {formatTime(liveQueueAppointment.endTime)}</span><span>{liveQueueAppointment.staffDepartment || 'Campus clinic'}</span></p>
      </article>
    );
  }

  function renderAppointment(appointment, readOnly = false) {
    const status = appointment.status || 'PENDING';
    const rescheduleOptions = getRescheduleOptions(appointment);
    return (
      <article className="appointment-card" key={appointment.appointmentId}>
        <div className="appointment-heading"><div><h3>{appointment.appointmentType}</h3><p>{formatDate(appointment.slotDate)} · {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}</p></div><span className={`appointment-status ${status.toLowerCase()}`}>{status === 'NO_SHOW' ? 'NO-SHOW' : status}</span></div>
        <div className="appointment-meta-grid"><div><span>CLINICIAN</span><strong>{appointment.staffName || 'To be assigned'}</strong></div><div><span>ROOM</span><strong>{appointment.roomNumber || 'To be assigned'}</strong></div><div><span>DEPARTMENT</span><strong>{appointment.staffDepartment || 'Clinic'}</strong></div></div>
        {status === 'CONFIRMED' && <p className="appointment-queue-note">Queue position: <strong>#{appointment.queuePosition || 1}</strong> · Estimated wait: <strong>{appointment.estimatedWaitMinutes || 0} minutes</strong></p>}
        {appointment.notes && <p className="appointment-notes"><strong>Your notes:</strong> {appointment.notes}</p>}
        {status === 'COMPLETED' && <p className="appointment-completed-note">This completed visit contributed to your Health Points.</p>}
        {status === 'NO_SHOW' && <p className="appointment-notes">This appointment was recorded as a no-show.</p>}
        {!readOnly && ACTIVE_STATUSES.includes(status) && (
          <div className="appointment-actions">
            <select value={rescheduleSlots[appointment.appointmentId] || ''} onChange={(event) => setRescheduleSlots((current) => ({ ...current, [appointment.appointmentId]: event.target.value }))} disabled={submitting || rescheduleOptions.length === 0} aria-label={`New slot for ${appointment.appointmentType}`}>
              <option value="">{rescheduleOptions.length === 0 ? 'No matching slots available' : 'Choose a new time slot'}</option>
              {rescheduleOptions.map((slot) => <option value={slot.slotId} key={slot.slotId}>{formatSlot(slot)}</option>)}
            </select>
            <button type="button" className="secondary-button" disabled={submitting || rescheduleOptions.length === 0} onClick={() => handleReschedule(appointment.appointmentId)}>Reschedule</button>
            <button type="button" className="danger-button" disabled={submitting} onClick={() => handleCancellation(appointment.appointmentId)}>Cancel</button>
          </div>
        )}
      </article>
    );
  }

  const identity = { ...user, ...studentProfile };
  const profileImageUrl = useProfileImage(
    Boolean(identity.hasProfileImage),
    profileImageVersion,
  );
  const notifications = useMemo(
    () => studentNotifications(appointments),
    [appointments],
  );
  const sidebarItems = [
    { section: 'overview', label: 'Dashboard', icon: 'overview' },
    { section: 'appointments', label: 'Bookings', icon: 'appointments' },
    { section: 'history', label: 'History', icon: 'history' },
    { section: 'rewards', label: 'Health Rewards', icon: 'rewards' },
    { section: 'sick-notes', label: 'Sick Notes', icon: 'sick-notes' },
    { section: 'profile', label: 'My Profile', icon: 'profile' },
  ];
  const menuItems = sidebarItems.map((item) => ({
    label: item.label,
    active: dashboardSection === item.section,
    onSelect: () => selectSection(item.section),
  }));
  menuItems.push({ label: 'Home', to: '/' });

  const sectionDetails = {
    overview: ['STUDENT DASHBOARD', 'Book a clinic service or check your appointments below.'],
    appointments: ['Bookings', 'Manage appointments and clinic bookings.'],
    history: ['History', 'Review your completed and cancelled consultations.'],
    rewards: ['Health Rewards', 'Track completed visits, points and food vouchers.'],
    'sick-notes': ['Sick Notes', 'Request and manage your medical sick notes.'],
    profile: ['My Profile', 'Your personal, academic and emergency details.'],
  };
  const [sectionTitle, sectionSubtitle] = sectionDetails[dashboardSection];

  function renderOverview() {
    return (
      <>
        <section className="student-top-actions" aria-label="Student quick actions">
          <button type="button" onClick={() => selectSection('appointments')}>
            <span><StudentActionIcon type="booking" /></span>
            <strong>Book an appointment</strong>
            <small>Find an available clinic time</small>
          </button>
          <button type="button" onClick={() => selectSection('rewards')}>
            <span><StudentActionIcon type="rewards" /></span>
            <strong>View Health Rewards</strong>
            <small>Track points and vouchers</small>
          </button>
          <button type="button" onClick={() => selectSection('profile')}>
            <span><StudentActionIcon type="profile" /></span>
            <strong>Update my profile</strong>
            <small>Keep your details current</small>
          </button>
        </section>
        <section className="student-welcome-banner"><h1>Welcome, {identity.firstName || 'Student'}.</h1></section>
        <section className="student-service-section">
          <div className="student-section-heading">
            <div><h2>Book a Service</h2><p>Choose a backend-supported campus clinic service.</p></div>
            <button type="button" className="text-action" onClick={() => selectSection('appointments')}>View bookings →</button>
          </div>
          <div className="student-service-grid">
            {APPOINTMENT_TYPES.map((type) => (
              <button
                type="button"
                onClick={() => {
                  setAppointmentType(type);
                  setSelectedSlotId('');
                  selectSection('appointments');
                }}
                key={type}
              >
                <strong>{type}</strong>
                <span>{APPOINTMENT_SERVICE_DESCRIPTIONS[type]}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="dashboard-summary student-overview-summary"><article><span>Active bookings</span><strong>{activeAppointments.length}</strong></article><article><span>Confirmed visits</span><strong>{confirmedAppointments.length}</strong></article><article><span>Health Points</span><strong>{healthPoints}</strong></article><article><span>Available slots</span><strong>{availableSlots.length}</strong></article></section>
        {renderQueueCard()}
        <section className="student-overview-grid student-overview-grid--single">
          <article className="dashboard-panel"><div className="student-section-heading"><div><p className="eyebrow">UP NEXT</p><h2>Upcoming appointments</h2></div><button type="button" className="text-action" onClick={() => selectSection('appointments')}>View all</button></div>{loading ? <p>Loading appointments...</p> : sortedActiveAppointments.length === 0 ? <p className="empty-message">You have no active appointments.</p> : <div className="appointment-list compact-appointment-list">{sortedActiveAppointments.slice(0, 2).map((appointment) => renderAppointment(appointment, true))}</div>}</article>
        </section>
      </>
    );
  }

  function renderAppointments() {
    return (
      <section className="dashboard-grid student-appointments-grid"><div><article className="dashboard-panel"><p className="eyebrow">NEW APPOINTMENT</p><h2>Book a clinic visit</h2><form className="booking-form" onSubmit={handleBooking}><label>Appointment type<select value={appointmentType} onChange={(event) => { setAppointmentType(event.target.value); setSelectedSlotId(''); }} disabled={submitting}>{APPOINTMENT_TYPES.map((type) => <option value={type} key={type}>{type}</option>)}</select></label><label>Available time slot<select value={selectedSlotId} onChange={(event) => setSelectedSlotId(event.target.value)} required disabled={submitting || loading || availableSlots.length === 0}><option value="">{loading ? 'Loading available slots...' : availableSlots.length === 0 ? 'No available slots for this type' : 'Select a time slot'}</option>{availableSlots.map((slot) => <option value={slot.slotId} key={slot.slotId}>{formatSlot(slot)}</option>)}</select></label><label>Notes for the clinic<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} disabled={submitting} placeholder="Optional information about your visit" /></label><button type="submit" className="primary-button" disabled={submitting || loading || availableSlots.length === 0}>{submitting ? 'Booking...' : 'Confirm appointment'}</button></form></article></div><article className="dashboard-panel bookings-panel"><p className="eyebrow">ACTIVE BOOKINGS</p><h2>My appointments</h2><div className="booking-tabs">{appointmentTabs.map(([key, label]) => <button type="button" className={activeTab === key ? 'booking-tab active' : 'booking-tab'} onClick={() => setActiveTab(key)} key={key}>{label} ({key === 'all' ? activeAppointments.length : activeAppointments.filter((item) => item.status === key.toUpperCase()).length})</button>)}</div>{loading ? <p>Loading appointments...</p> : visibleActive.length === 0 ? <p className="empty-message">No active appointments in this section.</p> : <div className="appointment-list">{visibleActive.map((appointment) => renderAppointment(appointment))}</div>}</article></section>
    );
  }

  function renderHistoryRecord(appointment) {
    const expanded = selectedHistoryId === appointment.appointmentId;
    const status = appointment.status || 'COMPLETED';

    return (
      <article className={`student-history-record${expanded ? ' is-expanded' : ''}`} key={appointment.appointmentId}>
        <button
          type="button"
          className="student-history-record__summary"
          aria-expanded={expanded}
          onClick={() =>
            setSelectedHistoryId((current) =>
              current === appointment.appointmentId
                ? null
                : appointment.appointmentId,
            )
          }
        >
          <span>
            <strong>{appointment.appointmentType}</strong>
            <small>{formatDate(appointment.slotDate)} · {formatTime(appointment.startTime)}</small>
          </span>
          <span>{appointment.staffName || 'Clinic staff'}</span>
          <span className={`appointment-status ${status.toLowerCase()}`}>{status === 'NO_SHOW' ? 'NO-SHOW' : status}</span>
          <span className="student-history-record__chevron" aria-hidden="true">⌄</span>
        </button>
        {expanded && (
          <div className="student-history-record__body">
            {renderAppointment(appointment, true)}
          </div>
        )}
      </article>
    );
  }

  function renderHistory() {
    const filtersActive =
      historyFilter !== 'all' ||
      historyTypeFilter !== 'ALL' ||
      historyDateFrom ||
      historyDateTo;

    return (
      <section className="student-history">
        <article className="dashboard-panel student-history__panel">
          <header className="student-history__toolbar">
            <div><h2>Consultation history</h2><span>{visibleHistory.length} of {historyAppointments.length} records</span></div>
            <div className="student-history__filters" aria-label="Filter consultation history">
              <label><span>Status</span><select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}><option value="all">All statuses</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No-show</option></select></label>
              <label><span>Consultation</span><select value={historyTypeFilter} onChange={(event) => setHistoryTypeFilter(event.target.value)}><option value="ALL">All types</option>{historyConsultationTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
              <label><span>From</span><input type="date" value={historyDateFrom} max={historyDateTo || undefined} onChange={(event) => setHistoryDateFrom(event.target.value)} /></label>
              <label><span>To</span><input type="date" value={historyDateTo} min={historyDateFrom || undefined} onChange={(event) => setHistoryDateTo(event.target.value)} /></label>
              {filtersActive && <button type="button" onClick={() => { setHistoryFilter('all'); setHistoryTypeFilter('ALL'); setHistoryDateFrom(''); setHistoryDateTo(''); }}>Clear</button>}
            </div>
          </header>
          {loading ? <p>Loading appointment history...</p> : visibleHistory.length === 0 ? <p className="empty-message">No consultation records match these filters.</p> : <div className="appointment-list student-history__list">{visibleHistory.map(renderHistoryRecord)}</div>}
        </article>
      </section>
    );
  }

  return (
    <main className="student-dashboard dashboard-shell student-dashboard--shell">
      <DashboardSidebar
        activeSection={dashboardSection}
        ariaLabel="Student dashboard navigation"
        items={sidebarItems}
        onSelect={selectSection}
        onSignOut={handleLogout}
      />

      <div className="dashboard-workspace student-workspace">
        <ResponsiveHeader
          ariaLabel="Student dashboard navigation"
          desktopSignOut={false}
          identity={{
            name: `${identity.firstName || 'Student'} ${identity.lastName || ''}`.trim(),
            detail: identity.studentNumber || 'Student',
            imageUrl: profileImageUrl,
          }}
          menuItems={menuItems}
          notificationKey={`student-${user.userId}`}
          notifications={notifications}
          onNotificationSelect={(notification) => selectSection(notification.section)}
          onSignOut={handleLogout}
          showLogo={false}
          title={sectionTitle}
          subtitle={sectionSubtitle}
        />

        <div className="dashboard-content student-shell-content">
          {message && <p className="dashboard-message student-shell-message" role="status">{message}</p>}
          {dashboardSection === 'overview' && renderOverview()}
          {dashboardSection === 'appointments' && renderAppointments()}
          {dashboardSection === 'history' && renderHistory()}
          {dashboardSection === 'rewards' && <HealthRewards healthPoints={healthPoints} />}
          {dashboardSection === 'sick-notes' && <StudentSickNotes appointments={appointments} />}
          {dashboardSection === 'profile' && <section className="student-profile-section"><StudentProfile imageUrl={profileImageUrl} onProfileUpdated={applyProfile} onPasswordChanged={handleLogout} onProfileImageChanged={(hasProfileImage) => { applyProfile({ ...identity, hasProfileImage }); setProfileImageVersion((current) => current + 1); }} /></section>}
        </div>
      </div>
    </main>
  );
}

export default StudentDashboard;
