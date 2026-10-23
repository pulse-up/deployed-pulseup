function appointmentDate(appointment) {
  const slotDate = appointment.slotDate || appointment.timeSlot?.slotDate;
  const startTime = appointment.startTime || appointment.timeSlot?.startTime || '00:00';
  if (!slotDate) return null;
  const value = new Date(`${slotDate}T${startTime}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function readableDate(appointment) {
  const date = appointmentDate(appointment);
  return date
    ? new Intl.DateTimeFormat('en-ZA', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    : 'Date unavailable';
}

const STATUS_COPY = {
  PENDING: ['Booking submitted', 'Your booking is awaiting clinic confirmation.'],
  CONFIRMED: ['Booking confirmed', 'Your clinic booking has been confirmed.'],
  RESCHEDULED: ['Booking rescheduled', 'Your booking time has changed and needs confirmation.'],
  CANCELLED: ['Booking cancelled', 'This clinic booking has been cancelled.'],
  COMPLETED: ['Visit completed', 'Your completed visit is now in your health history.'],
  NO_SHOW: ['Appointment update', 'This appointment was recorded as a no-show.'],
};

export function studentNotifications(appointments) {
  const now = Date.now();
  const notifications = [];

  appointments.forEach((appointment) => {
    const status = appointment.status || 'PENDING';
    const copy = STATUS_COPY[status] || ['Booking update', `Status: ${status}`];
    const slotKey = `${appointment.slotDate || ''}-${appointment.startTime || ''}`;
    notifications.push({
      id: `student-${appointment.appointmentId}-${status}-${slotKey}`,
      title: copy[0],
      message: `${appointment.appointmentType}: ${copy[1]}`,
      meta: readableDate(appointment),
      section: status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW' ? 'history' : 'appointments',
    });

    const date = appointmentDate(appointment);
    const hoursUntil = date ? (date.getTime() - now) / 3600000 : null;
    if (status === 'CONFIRMED' && hoursUntil >= 0 && hoursUntil <= 48) {
      notifications.unshift({
        id: `student-reminder-${appointment.appointmentId}-${slotKey}`,
        title: hoursUntil <= 24 ? 'Appointment reminder' : 'Upcoming appointment',
        message: `${appointment.appointmentType} is scheduled soon in ${appointment.roomNumber || 'the assigned clinic room'}.`,
        meta: readableDate(appointment),
        section: 'appointments',
      });
    }
  });

  return notifications.slice(0, 20);
}

export function staffNotifications(appointments, openSlots, pendingSickNotes) {
  const notifications = appointments
    .filter((appointment) => ['PENDING', 'RESCHEDULED'].includes(appointment.status || 'PENDING'))
    .map((appointment) => ({
      id: `staff-${appointment.appointmentId}-${appointment.status || 'PENDING'}`,
      title: appointment.status === 'RESCHEDULED' ? 'Rescheduled booking' : 'New booking request',
      message: `${appointment.student?.firstName || 'A student'} requested ${appointment.appointmentType}.`,
      meta: readableDate(appointment),
      section: 'bookings',
    }));

  if (pendingSickNotes > 0) {
    notifications.unshift({
      id: `staff-sick-notes-${pendingSickNotes}`,
      title: 'Sick notes awaiting review',
      message: `${pendingSickNotes} request${pendingSickNotes === 1 ? '' : 's'} need a decision.`,
      meta: 'Clinic review queue',
      section: 'sick-notes',
    });
  }
  if (openSlots === 0) {
    notifications.push({
      id: 'staff-no-open-slots',
      title: 'No open availability',
      message: 'Publish a time slot so students can book your clinic service.',
      meta: 'Availability',
      section: 'availability',
    });
  }

  return notifications.slice(0, 20);
}

export function adminNotifications(appointments, timeSlots) {
  const pending = appointments.filter((item) => ['PENDING', 'RESCHEDULED'].includes(item.status || 'PENDING'));
  const closed = timeSlots.filter((slot) => !slot.available).length;
  const notifications = pending.slice(0, 12).map((appointment) => ({
    id: `admin-${appointment.appointmentId}-${appointment.status || 'PENDING'}`,
    title: appointment.status === 'RESCHEDULED' ? 'Rescheduled appointment' : 'Pending appointment',
    message: `${appointment.appointmentType} requires clinic attention.`,
    meta: readableDate(appointment),
    section: 'appointments',
  }));

  if (closed > 0) {
    notifications.push({
      id: `admin-closed-slots-${closed}`,
      title: 'Closed or booked slots',
      message: `${closed} time slot${closed === 1 ? '' : 's'} are not currently open.`,
      meta: 'Availability overview',
      section: 'slots',
    });
  }
  return notifications.slice(0, 20);
}
