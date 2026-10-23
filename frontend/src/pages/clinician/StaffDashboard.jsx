import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardSidebar from '../../components/shared/DashboardSidebar';
import ProfileImageUploader from '../../components/shared/ProfileImageUploader';
import ResponsiveHeader from '../../components/shared/ResponsiveHeader';
import SickNoteReviewPanel from '../../components/shared/SickNoteReviewPanel';
import api from '../../lib/api/api';
import useProfileImage from '../../lib/hooks/useProfileImage';
import { staffNotifications } from '../../lib/utils/dashboardNotifications';
import { STAFF_SERVICES as SERVICE_CATALOG } from '../../lib/config/domainOptions';
import {
  clearSession,
  getStoredUser,
  getToken,
  normalizeRole,
} from '../../lib/utils/session';

function getServiceConfiguration(department) {
  const normalisedDepartment = String(department || '').trim().toLowerCase();

  return (
    SERVICE_CATALOG.find(
      (service) =>
        service.appointmentType.toLowerCase() === normalisedDepartment,
    ) || null
  );
}

function getToday() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(dateValue) {
  if (!dateValue) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${dateValue}T00:00:00`));
}

function formatTime(timeValue) {
  return timeValue ? timeValue.slice(0, 5) : 'Time unavailable';
}

function StaffDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser() || {});
  const [staffProfile, setStaffProfile] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [activeSection, setActiveSection] = useState('overview');
  const [pendingSickNotes, setPendingSickNotes] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileImageVersion, setProfileImageVersion] = useState(0);
  const [slotForm, setSlotForm] = useState({
    slotDate: '',
    startTime: '',
    endTime: '',
    appointmentType: 'General Consultations',
    roomNumber: 'Unit A1',
    estimatedDurationMinutes: '20',
  });

  const userRole = normalizeRole(user.role);
  const userToken = getToken(user);
  const today = getToday();

  const loadDashboardData = useCallback(async () => {
    try {
      const [profileResponse, slotsResponse, appointmentsResponse] =
        await Promise.all([
          api.get('/staff/me'),
          api.get(`/time-slots/staff/${user.userId}`),
          api.get(`/appointments/staff/${user.userId}`),
        ]);
      const profile = profileResponse.data || {};
      const serviceConfiguration = getServiceConfiguration(profile.department);

      setStaffProfile(profile);
      setTimeSlots(Array.isArray(slotsResponse.data) ? slotsResponse.data : []);
      setAppointments(
        Array.isArray(appointmentsResponse.data)
          ? appointmentsResponse.data
          : [],
      );

      if (serviceConfiguration) {
        setSlotForm((currentForm) => ({
          ...currentForm,
          appointmentType: serviceConfiguration.appointmentType,
          roomNumber: serviceConfiguration.roomNumber,
          estimatedDurationMinutes:
            currentForm.estimatedDurationMinutes ||
            String(serviceConfiguration.duration),
        }));
      }
    } catch (error) {
      console.error('Staff dashboard loading failed:', error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        clearSession();
        navigate('/login', { replace: true });
        return;
      }

      setMessage('Could not load the staff dashboard.');
    } finally {
      setLoading(false);
    }
  }, [navigate, user.userId]);

  useEffect(() => {
    if (!user.userId || !userToken || userRole !== 'STAFF') {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) void loadDashboardData();
    });

    return () => {
      cancelled = true;
    };
  }, [loadDashboardData, navigate, user.userId, userRole, userToken]);

  useEffect(() => {
    if (!userToken || userRole !== 'STAFF') return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadDashboardData();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [loadDashboardData, userRole, userToken]);

  const pendingAppointments = appointments.filter(
    (appointment) =>
      appointment.status === 'PENDING' || appointment.status === 'RESCHEDULED',
  );
  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === 'CONFIRMED',
  );
  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === 'COMPLETED',
  );
  const cancelledAppointments = appointments.filter(
    (appointment) => appointment.status === 'CANCELLED',
  );

  function getVisibleAppointments() {
    switch (activeTab) {
      case 'confirmed':
        return confirmedAppointments;
      case 'completed':
        return completedAppointments;
      case 'cancelled':
        return cancelledAppointments;
      default:
        return pendingAppointments;
    }
  }

  function handleSlotChange(event) {
    const { name, value } = event.target;
    setSlotForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleCreateSlot(event) {
    event.preventDefault();
    const serviceConfiguration = getServiceConfiguration(
      staffProfile.department,
    );
    const duration = Number(slotForm.estimatedDurationMinutes);

    if (!serviceConfiguration) {
      setMessage(
        'Your staff department is not linked to a valid appointment type.',
      );
      return;
    }

    if (
      !slotForm.slotDate ||
      !slotForm.startTime ||
      !slotForm.endTime ||
      !slotForm.roomNumber.trim()
    ) {
      setMessage('Complete all time-slot fields.');
      return;
    }

    if (slotForm.startTime >= slotForm.endTime) {
      setMessage('The end time must be after the start time.');
      return;
    }

    if (!Number.isInteger(duration) || duration < 1 || duration > 180) {
      setMessage('The duration must be between 1 and 180 minutes.');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      await api.post('/time-slots', null, {
        params: {
          staffId: user.userId,
          slotDate: slotForm.slotDate,
          startTime: slotForm.startTime,
          endTime: slotForm.endTime,
          appointmentType: serviceConfiguration.appointmentType,
          roomNumber: slotForm.roomNumber.trim(),
          estimatedDurationMinutes: duration,
        },
      });
      setSlotForm({
        slotDate: '',
        startTime: '',
        endTime: '',
        appointmentType: serviceConfiguration.appointmentType,
        roomNumber: serviceConfiguration.roomNumber,
        estimatedDurationMinutes: String(serviceConfiguration.duration),
      });
      await loadDashboardData();
      setMessage('The time slot was created successfully.');
    } catch (error) {
      console.error(
        'Time-slot creation failed:',
        error.response?.status,
        error.response?.data || error.message,
      );

      if (error.response?.status === 400) {
        setMessage(
          'The server rejected the slot. Check the date, time, room, and duration.',
        );
      } else if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        setMessage('You do not have permission to create this time slot.');
      } else {
        setMessage('The time slot could not be created.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate(appointmentId, status) {
    if (!appointmentId) {
      setMessage('The appointment ID is missing.');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      await api.patch(`/appointments/${appointmentId}/status`, null, {
        params: { status },
      });
      await loadDashboardData();

      if (status === 'CONFIRMED') {
        setActiveTab('confirmed');
        setMessage('The appointment was confirmed successfully.');
      } else if (status === 'COMPLETED') {
        setActiveTab('completed');
        setMessage('The appointment was marked as attended.');
      }
    } catch (error) {
      console.error(
        'Appointment status update failed:',
        error.response?.status,
        error.response?.data || error.message,
      );
      setMessage(
        error.response?.status === 403
          ? 'You can update only appointments assigned to your time slots.'
          : 'The appointment status could not be updated.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  function renderAppointment(appointment) {
    const status = appointment.status || 'PENDING';
    const student = appointment.student;
    const slot = appointment.timeSlot;

    return (
      <article className="appointment-card" key={appointment.appointmentId}>
        <div className="appointment-heading">
          <div>
            <h3>{appointment.appointmentType}</h3>
            <p>
              {formatDate(slot?.slotDate)} · {formatTime(slot?.startTime)} –{' '}
              {formatTime(slot?.endTime)}
            </p>
          </div>
          <span className={`appointment-status ${status.toLowerCase()}`}>
            {status}
          </span>
        </div>

        <div className="appointment-meta-grid">
          <div>
            <span>STUDENT</span>
            <strong>
              {student?.firstName || 'Unknown'} {student?.lastName || 'student'}
            </strong>
          </div>
          <div>
            <span>ROOM</span>
            <strong>{slot?.roomNumber || 'Not assigned'}</strong>
          </div>
          <div>
            <span>DURATION</span>
            <strong>{slot?.estimatedDurationMinutes || 0} minutes</strong>
          </div>
        </div>

        <div className="student-details">
          {student?.studentNumber && (
            <span>Student number: {student.studentNumber}</span>
          )}
          {student?.email && <span>{student.email}</span>}
        </div>

        {appointment.notes && (
          <p className="appointment-notes">
            <strong>Student notes:</strong> {appointment.notes}
          </p>
        )}

        <div className="staff-appointment-actions">
          {(status === 'PENDING' || status === 'RESCHEDULED') && (
            <button
              type="button"
              className="primary-button"
              disabled={submitting}
              onClick={() =>
                handleStatusUpdate(appointment.appointmentId, 'CONFIRMED')
              }
            >
              {submitting ? 'Updating...' : 'Confirm appointment'}
            </button>
          )}
          {status === 'CONFIRMED' && (
            <button
              type="button"
              className="complete-button"
              disabled={submitting}
              onClick={() =>
                handleStatusUpdate(appointment.appointmentId, 'COMPLETED')
              }
            >
              {submitting ? 'Updating...' : 'Mark as completed'}
            </button>
          )}
        </div>
      </article>
    );
  }

  function renderSummary() {
    return (
      <section className="dashboard-summary staff-overview-summary">
        <article>
          <span>My time slots</span>
          <strong>{timeSlots.length}</strong>
        </article>
        <article>
          <span>Pending bookings</span>
          <strong>{pendingAppointments.length}</strong>
        </article>
        <article>
          <span>Confirmed</span>
          <strong>{confirmedAppointments.length}</strong>
        </article>
      </section>
    );
  }

  function renderProfile() {
    const profileDetails = [
      ['STAFF NUMBER', staffProfile.staffNumber],
      ['EMAIL', staffProfile.email || user.email],
      ['PHONE', staffProfile.phoneNumber],
      ['DEPARTMENT', staffProfile.department],
      ['POSITION', staffProfile.position],
      ['SPECIALIZATION', staffProfile.specialization],
      ['AVAILABILITY', staffProfile.availabilityStatus || 'AVAILABLE'],
    ];

    return (
      <>
        <ProfileImageUploader
          hasProfileImage={Boolean(staffProfile.hasProfileImage)}
          imageUrl={profileImageUrl}
          name={`${staffProfile.firstName || user.firstName || ''} ${staffProfile.lastName || user.lastName || ''}`.trim()}
          onChanged={(hasProfileImage) => {
            setStaffProfile((current) => ({ ...current, hasProfileImage }));
            setProfileImageVersion((current) => current + 1);
          }}
        />
        <section
          className="staff-profile-summary"
          aria-label="Staff profile details"
        >
          {profileDetails.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value || 'Not available'}</strong>
            </div>
          ))}
        </section>
      </>
    );
  }

  function renderBookings() {
    const tabs = [
      ['pending', 'Pending', pendingAppointments.length],
      ['confirmed', 'Confirmed', confirmedAppointments.length],
      ['completed', 'Completed', completedAppointments.length],
      ['cancelled', 'Cancelled', cancelledAppointments.length],
    ];
    const visibleAppointments = getVisibleAppointments();

    return (
      <article className="dashboard-panel staff-bookings-panel">
        <p className="eyebrow">STUDENT APPOINTMENTS</p>
        <h2>Manage bookings</h2>
        <div className="booking-tabs">
          {tabs.map(([key, label, count]) => (
            <button
              type="button"
              className={activeTab === key ? 'booking-tab active' : 'booking-tab'}
              onClick={() => setActiveTab(key)}
              key={key}
            >
              {label} ({count})
            </button>
          ))}
        </div>
        {loading ? (
          <p>Loading appointments...</p>
        ) : visibleAppointments.length === 0 ? (
          <p className="empty-message">No appointments in this section.</p>
        ) : (
          <div className="appointment-list">
            {visibleAppointments.map(renderAppointment)}
          </div>
        )}
      </article>
    );
  }

  function renderAvailability() {
    const serviceConfiguration = getServiceConfiguration(
      staffProfile.department,
    );

    return (
      <section className="staff-availability-grid">
        <article className="dashboard-panel">
          <p className="eyebrow">CREATE TIME SLOT</p>
          <h2>Open availability</h2>
          <form className="booking-form" onSubmit={handleCreateSlot}>
            <label>
              Appointment type
              <select
                name="appointmentType"
                value={slotForm.appointmentType}
                disabled
              >
                <option
                  value={
                    serviceConfiguration?.appointmentType ||
                    slotForm.appointmentType
                  }
                >
                  {serviceConfiguration?.appointmentType ||
                    slotForm.appointmentType}
                </option>
              </select>
            </label>
            <label>
              Date
              <input
                type="date"
                name="slotDate"
                min={today}
                value={slotForm.slotDate}
                onChange={handleSlotChange}
                disabled={submitting}
                required
              />
            </label>
            <div className="staff-time-fields">
              <label>
                Start time
                <input
                  type="time"
                  name="startTime"
                  value={slotForm.startTime}
                  onChange={handleSlotChange}
                  disabled={submitting}
                  required
                />
              </label>
              <label>
                End time
                <input
                  type="time"
                  name="endTime"
                  value={slotForm.endTime}
                  onChange={handleSlotChange}
                  disabled={submitting}
                  required
                />
              </label>
            </div>
            <label>
              Clinic room / unit
              <input
                type="text"
                name="roomNumber"
                value={slotForm.roomNumber}
                onChange={handleSlotChange}
                disabled={submitting}
                required
              />
            </label>
            <label>
              Estimated duration in minutes
              <input
                type="number"
                name="estimatedDurationMinutes"
                min="1"
                max="180"
                value={slotForm.estimatedDurationMinutes}
                onChange={handleSlotChange}
                disabled={submitting}
                required
              />
            </label>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting || !serviceConfiguration}
            >
              {submitting ? 'Creating...' : 'Create time slot'}
            </button>
          </form>
        </article>

        <article className="dashboard-panel">
          <p className="eyebrow">MY AVAILABILITY</p>
          <h2>Published slots</h2>
          {loading ? (
            <p>Loading time slots...</p>
          ) : timeSlots.length === 0 ? (
            <p className="empty-message">You have not created any time slots.</p>
          ) : (
            <div className="slot-list">
              {timeSlots.map((slot) => (
                <article className="slot-card" key={slot.slotId}>
                  <div>
                    <strong>{slot.appointmentType}</strong>
                    <span>{formatDate(slot.slotDate)}</span>
                    <span>
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </span>
                    <span>
                      {slot.roomNumber} · {slot.estimatedDurationMinutes} minutes
                    </span>
                    <span
                      className={
                        slot.available
                          ? 'slot-status available'
                          : 'slot-status booked'
                      }
                    >
                      {slot.available ? 'Available' : 'Booked'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    );
  }

  const identity = { ...user, ...staffProfile };
  const profileImageUrl = useProfileImage(
    Boolean(identity.hasProfileImage),
    profileImageVersion,
  );
  const notifications = staffNotifications(
    appointments,
    timeSlots.filter((slot) => slot.available).length,
    pendingSickNotes,
  );
  const sidebarItems = [
    { section: 'overview', label: 'Dashboard', icon: 'overview' },
    { section: 'bookings', label: 'Manage bookings', icon: 'bookings' },
    { section: 'availability', label: 'Open availability', icon: 'availability' },
    {
      section: 'sick-notes',
      label: 'Sick Notes',
      icon: 'sick-notes',
      badge: pendingSickNotes,
    },
    { section: 'profile', label: 'My Profile', icon: 'profile' },
  ];
  const menuItems = sidebarItems.map((item) => ({
    label: item.badge > 0 ? `${item.label} (${item.badge})` : item.label,
    active: activeSection === item.section,
    onSelect: () => setActiveSection(item.section),
  }));
  menuItems.push({ label: 'Home', to: '/' });

  const sectionDetails = {
    overview: ['Dashboard', 'Your clinic schedule and activity overview.'],
    bookings: ['Manage Bookings', 'Review and update student appointments.'],
    availability: ['Open Availability', 'Publish clinic time slots for students.'],
    'sick-notes': ['Sick Notes', 'Review student medical sick-note requests.'],
    profile: ['My Profile', 'Your clinical assignment and contact details.'],
  };
  const [sectionTitle, sectionSubtitle] = sectionDetails[activeSection];

  return (
    <main className="student-dashboard dashboard-shell staff-dashboard staff-dashboard--shell">
      <DashboardSidebar
        activeSection={activeSection}
        ariaLabel="Staff dashboard navigation"
        items={sidebarItems}
        onSelect={setActiveSection}
        onSignOut={handleLogout}
      />

      <div className="dashboard-workspace staff-workspace">
        <ResponsiveHeader
          ariaLabel="Staff dashboard navigation"
          desktopSignOut={false}
          identity={{
            name: `${identity.firstName || 'Clinic'} ${identity.lastName || 'staff'}`.trim(),
            detail: identity.position || 'Clinic staff',
            imageUrl: profileImageUrl,
          }}
          menuItems={menuItems}
          notificationKey={`staff-${user.userId}`}
          notifications={notifications}
          onNotificationSelect={(notification) => setActiveSection(notification.section)}
          onSignOut={handleLogout}
          showLogo={false}
          title={sectionTitle}
          subtitle={sectionSubtitle}
        />

        <div className="dashboard-content staff-shell-content">
          {message && (
            <p className="dashboard-message staff-shell-message" role="status">
              {message}
            </p>
          )}

          {activeSection === 'overview' && (
            <>
              <section className="staff-welcome-banner">
                <p className="eyebrow">CLINIC STAFF</p>
                <h1>Welcome, {identity.firstName || 'clinic staff'}.</h1>
                <p>{staffProfile.department || 'Clinic department'} · {staffProfile.position || 'Clinic staff'}</p>
              </section>
              {renderSummary()}
              <section className="staff-overview-grid">
                <article className="dashboard-panel staff-welcome-panel">
                  <p className="eyebrow">TODAY AT A GLANCE</p>
                  <h2>Manage today’s clinic activity</h2>
                  <p>
                    You have {pendingAppointments.length} booking
                    {pendingAppointments.length === 1 ? '' : 's'} awaiting review
                    and {timeSlots.filter((slot) => slot.available).length} open
                    time slot
                    {timeSlots.filter((slot) => slot.available).length === 1 ? '' : 's'}.
                  </p>
                  <div className="staff-quick-actions">
                    <button type="button" onClick={() => setActiveSection('bookings')}>Manage bookings</button>
                    <button type="button" onClick={() => setActiveSection('availability')}>Open availability</button>
                  </div>
                </article>
                <article className="dashboard-panel staff-overview-profile">
                  <p className="eyebrow">CLINICAL ASSIGNMENT</p>
                  <h2>{staffProfile.department || 'Not assigned'}</h2>
                  <p>{staffProfile.specialization || 'Specialization not captured'}</p>
                  <span className="slot-status available">{staffProfile.availabilityStatus || 'AVAILABLE'}</span>
                </article>
              </section>
            </>
          )}
          {activeSection === 'bookings' && renderBookings()}
          {activeSection === 'availability' && renderAvailability()}
          {activeSection === 'sick-notes' && (
            <article className="dashboard-panel staff-sick-note-content">
              <SickNoteReviewPanel mode="staff" onPendingCountChange={setPendingSickNotes} />
            </article>
          )}
          {activeSection === 'profile' && renderProfile()}
        </div>
      </div>
    </main>
  );
}

export default StaffDashboard;
