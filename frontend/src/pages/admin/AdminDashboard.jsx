import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from '../../lib/api/api';
import {
    clearSession,
    getStoredUser,
    getToken,
    normalizeRole,
} from '../../lib/utils/session';
import AdminStaffCreationForm from '../../components/admin/AdminStaffCreationForm';
import AdminUserRecords from '../../components/admin/AdminUserRecords';
import DashboardSidebar from '../../components/shared/DashboardSidebar';
import ResponsiveHeader from '../../components/shared/ResponsiveHeader';
import { adminNotifications } from '../../lib/utils/dashboardNotifications';
import SickNoteReviewPanel from '../../components/shared/SickNoteReviewPanel';

const LIVE_REFRESH_MS = 30000;

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "RESCHEDULED"];

const STATUS_LABELS = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    RESCHEDULED: "Rescheduled",
    COMPLETED: "Attended",
    CANCELLED: "Cancelled",
    NO_SHOW: "No-show",
};

function getSlotTime(slot, timeValue) {
    if (!slot?.slotDate || !timeValue) {
        return null;
    }

    const date = new Date(`${slot.slotDate}T${timeValue}`);

    return Number.isNaN(date.getTime()) ? null : date;
}

function isActiveStatus(status) {
    return ACTIVE_STATUSES.includes(status || "PENDING");
}

// Upcoming means still to happen: active status and the slot has not finished.
function isUpcomingAppointment(appointment, now) {
    if (!isActiveStatus(appointment.status)) {
        return false;
    }

    const end = getSlotTime(
        appointment.timeSlot,
        appointment.timeSlot?.endTime,
    );

    return !end || end >= now;
}

function isSameDay(date, now) {
    return Boolean(date) && date.toDateString() === now.toDateString();
}

function formatAdminDate(value) {
    if (!value) return "Date unavailable";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
        ? "Date unavailable"
        : new Intl.DateTimeFormat("en-ZA", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
}

function AdminDashboard() {
    const navigate = useNavigate();

    const [user] = useState(() => getStoredUser() || {});

    const userRole = normalizeRole(user.role);
    const userToken = getToken(user);

    const [students, setStudents] = useState([]);
    const [staff, setStaff] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [appointments, setAppointments] =
        useState([]);
    const [timeSlots, setTimeSlots] = useState([]);

    const [activeSection, setActiveSection] =
        useState("overview");

    const [appointmentView, setAppointmentView] =
        useState("upcoming");
    const [appointmentTypeFilter, setAppointmentTypeFilter] =
        useState("ALL");
    const [appointmentDateFrom, setAppointmentDateFrom] =
        useState("");
    const [appointmentDateTo, setAppointmentDateTo] =
        useState("");
    const [slotAvailabilityFilter, setSlotAvailabilityFilter] =
        useState("ALL");
    const [slotPeriodFilter, setSlotPeriodFilter] =
        useState("UPCOMING");

    const [lastUpdated, setLastUpdated] =
        useState(null);

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [workingItem, setWorkingItem] =
        useState("");

    const loadDashboardData = useCallback(
        async (silent = false) => {
            try {
                if (!silent) {
                    setLoading(true);
                    setMessage("");
                }

                const [
                    studentsResponse,
                    staffResponse,
                    adminsResponse,
                    appointmentsResponse,
                    slotsResponse,
                ] = await Promise.all([
                    api.get("/students"),
                    api.get("/staff"),
                    api.get("/admins"),
                    api.get("/appointments"),
                    api.get("/time-slots"),
                ]);

                setStudents(
                    Array.isArray(studentsResponse.data)
                        ? studentsResponse.data
                        : [],
                );

                setStaff(
                    Array.isArray(staffResponse.data)
                        ? staffResponse.data
                        : [],
                );

                setAdmins(
                    Array.isArray(adminsResponse.data)
                        ? adminsResponse.data
                        : [],
                );

                setAppointments(
                    Array.isArray(appointmentsResponse.data)
                        ? appointmentsResponse.data
                        : [],
                );

                setTimeSlots(
                    Array.isArray(slotsResponse.data)
                        ? slotsResponse.data
                        : [],
                );

                setLastUpdated(new Date());
            } catch (error) {
                console.error(
                    "Admin dashboard loading failed:",
                    error,
                );

                if (error.response?.status === 403) {
                    setMessage(
                        "You do not have permission to view the administration records.",
                    );
                } else {
                    setMessage(
                        "Could not load the administration records.",
                    );
                }
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        if (
            !user.userId ||
            !userToken ||
            userRole !== "ADMIN"
        ) {
            navigate("/login", {
                replace: true,
            });

            return;
        }

        let cancelled = false;

        window.queueMicrotask(() => {
            if (cancelled) {
                return;
            }

            loadDashboardData().catch((error) => {
                console.error(
                    "Admin dashboard initialisation failed:",
                    error,
                );
            });
        });

        return () => {
            cancelled = true;
        };
    }, [
        navigate,
        user.userId,
        userRole,
        userToken,
        loadDashboardData,
    ]);

    // Keep bookings, slots and staff availability live without a page reload.
    useEffect(() => {
        if (!user.userId || userRole !== "ADMIN") {
            return undefined;
        }

        const timer = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                loadDashboardData(true);
            }
        }, LIVE_REFRESH_MS);

        return () => window.clearInterval(timer);
    }, [user.userId, userRole, loadDashboardData]);

    async function handleDeleteUser(
        endpoint,
        userId,
        userName,
    ) {
        const confirmed = window.confirm(
            `Are you sure you want to remove ${userName}?`,
        );

        if (!confirmed) {
            return;
        }

        const itemKey = `${endpoint}-${userId}`;

        try {
            setWorkingItem(itemKey);
            setMessage("");

            await api.delete(`/${endpoint}/${userId}`);
            await loadDashboardData();

            setMessage(
                `${userName} was removed successfully.`,
            );
        } catch (error) {
            console.error(
                "User deletion failed:",
                error,
            );

            if (error.response?.status === 403) {
                setMessage(
                    "You do not have permission to remove this account.",
                );
            } else {
                setMessage(
                    `${userName} could not be removed. The account may still be linked to other records.`,
                );
            }
        } finally {
            setWorkingItem("");
        }
    }

    async function handleAppointmentStatus(
        appointmentId,
        status,
    ) {
        const itemKey =
            `appointment-${appointmentId}`;

        try {
            setWorkingItem(itemKey);
            setMessage("");

            if (status === "CANCELLED") {
                await api.patch(
                    `/appointments/${appointmentId}/cancel`,
                );
            } else {
                await api.patch(
                    `/appointments/${appointmentId}/status`,
                    {},
                    {
                        params: {
                            status,
                        },
                    },
                );
            }

            await loadDashboardData();

            setMessage(
                `The appointment was marked ${(STATUS_LABELS[status] || status).toLowerCase()}.`,
            );
        } catch (error) {
            console.error(
                "Appointment status update failed:",
                error.response?.status,
                error.response?.data || error.message,
            );

            setMessage(
                "The appointment status could not be updated.",
            );
        } finally {
            setWorkingItem("");
        }
    }

    async function handleDeleteAppointment(
        appointmentId,
    ) {
        const confirmed = window.confirm(
            "Are you sure you want to permanently remove this appointment?",
        );

        if (!confirmed) {
            return;
        }

        const itemKey =
            `appointment-${appointmentId}`;

        try {
            setWorkingItem(itemKey);
            setMessage("");

            await api.delete(
                `/appointments/${appointmentId}`,
            );

            await loadDashboardData();

            setMessage(
                "The appointment was removed.",
            );
        } catch (error) {
            console.error(
                "Appointment deletion failed:",
                error,
            );

            setMessage(
                "The appointment could not be removed.",
            );
        } finally {
            setWorkingItem("");
        }
    }

    async function handleDeleteSlot(slotId) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this available time slot?",
        );

        if (!confirmed) {
            return;
        }

        const itemKey = `slot-${slotId}`;

        try {
            setWorkingItem(itemKey);
            setMessage("");

            await api.delete(`/time-slots/${slotId}`);
            await loadDashboardData();

            setMessage(
                "The time slot was deleted.",
            );
        } catch (error) {
            console.error(
                "Time-slot deletion failed:",
                error,
            );

            setMessage(
                "The time slot could not be deleted.",
            );
        } finally {
            setWorkingItem("");
        }
    }

    async function handleSlotAvailability(slotId, available) {
        const itemKey = `slot-${slotId}`;

        try {
            setWorkingItem(itemKey);
            setMessage("");

            await api.patch(
                `/time-slots/${slotId}/availability`,
                {},
                {
                    params: {
                        available,
                    },
                },
            );

            await loadDashboardData(true);

            setMessage(
                available
                    ? "The time slot is open for booking."
                    : "The time slot is closed for booking.",
            );
        } catch (error) {
            console.error(
                "Time-slot availability update failed:",
                error.response?.status,
                error.response?.data || error.message,
            );

            setMessage(
                "The time slot could not be updated.",
            );
        } finally {
            setWorkingItem("");
        }
    }

    function handleLogout() {
        clearSession();

        navigate("/login", {
            replace: true,
        });
    }

    function renderUsers() {
        return (
            <AdminUserRecords
                admins={admins}
                currentAdminId={user.userId}
                onRemove={handleDeleteUser}
                staff={staff}
                students={students}
                workingItem={workingItem}
            />
        );
    }

    function renderOverview() {
        const now = new Date();

        const upcoming = appointments.filter((appointment) =>
            isUpcomingAppointment(appointment, now),
        );

        const bookedStudentIds = new Set(
            upcoming.map(
                (appointment) =>
                    appointment.student?.userId ??
                    appointment.appointmentId,
            ),
        );

        const todaysAppointments = appointments.filter(
            (appointment) =>
                isSameDay(
                    getSlotTime(
                        appointment.timeSlot,
                        appointment.timeSlot?.startTime,
                    ),
                    now,
                ),
        );

        const countToday = (status) =>
            todaysAppointments.filter(
                (appointment) =>
                    (appointment.status || "PENDING") === status,
            ).length;

        const openSlotsByStaff = {};

        timeSlots.forEach((slot) => {
            const end = getSlotTime(slot, slot.endTime);

            if (
                !slot.available ||
                !end ||
                end < now ||
                !isSameDay(end, now)
            ) {
                return;
            }

            const staffId = slot.staffId;

            openSlotsByStaff[staffId] =
                (openSlotsByStaff[staffId] || 0) + 1;
        });

        const clinicians = staff
            .map((member) => {
                const position = String(
                    member.position || "",
                ).toLowerCase();

                return {
                    member,
                    role: position.includes("doctor")
                        ? "Doctor"
                        : position.includes("nurse")
                            ? "Nurse"
                            : "",
                    openSlots:
                        openSlotsByStaff[member.userId] || 0,
                };
            })
            .filter((entry) => entry.role);

        const availableCount = (role) =>
            clinicians.filter(
                (entry) =>
                    entry.role === role && entry.openSlots > 0,
            ).length;

        const totalCount = (role) =>
            clinicians.filter((entry) => entry.role === role)
                .length;

        return (
            <div className="admin-record-groups">
                <section className="admin-record-group">
                    <h3>Right now</h3>

                    <div className="admin-summary-grid admin-live-grid">
                        <article>
                            <span>Students booked</span>
                            <strong>{bookedStudentIds.size}</strong>
                        </article>

                        <article>
                            <span>Upcoming appointments</span>
                            <strong>{upcoming.length}</strong>
                        </article>

                        <article>
                            <span>Doctors available</span>
                            <strong>
                                {availableCount("Doctor")} of{" "}
                                {totalCount("Doctor")}
                            </strong>
                        </article>

                        <article>
                            <span>Nurses available</span>
                            <strong>
                                {availableCount("Nurse")} of{" "}
                                {totalCount("Nurse")}
                            </strong>
                        </article>
                    </div>

                    <p className="muted-text">
                        {lastUpdated
                            ? `Updates every 30 seconds. Last updated ${lastUpdated.toLocaleTimeString()}.`
                            : "Updates every 30 seconds."}
                    </p>
                </section>

                <section className="admin-record-group">
                    <h3>Today's appointments</h3>

                    <div className="admin-summary-grid admin-live-grid">
                        <article>
                            <span>Still to happen</span>
                            <strong>
                                {countToday("PENDING") +
                                    countToday("CONFIRMED") +
                                    countToday("RESCHEDULED")}
                            </strong>
                        </article>

                        <article>
                            <span>Attended</span>
                            <strong>{countToday("COMPLETED")}</strong>
                        </article>

                        <article>
                            <span>Cancelled</span>
                            <strong>{countToday("CANCELLED")}</strong>
                        </article>

                        <article>
                            <span>No-show</span>
                            <strong>{countToday("NO_SHOW")}</strong>
                        </article>
                    </div>
                </section>

                <section className="admin-record-group">
                    <h3>Doctors and nurses today</h3>

                    {clinicians.length === 0 ? (
                        <p className="empty-message">
                            No doctors or nurses found. Staff are
                            listed here when their position
                            includes "Doctor" or "Nurse".
                        </p>
                    ) : (
                        <div className="admin-record-list">
                            {clinicians.map(
                                ({ member, role, openSlots }) => (
                                    <article
                                        className="admin-record-card"
                                        key={member.userId}
                                    >
                                        <div>
                                            <strong>
                                                {member.firstName}{" "}
                                                {member.lastName}
                                            </strong>

                                            <span>{role}</span>

                                            <span
                                                className={
                                                    openSlots > 0
                                                        ? "slot-status available"
                                                        : "slot-status booked"
                                                }
                                            >
                                                {openSlots > 0
                                                    ? `Available · ${openSlots} open ${openSlots === 1 ? "slot" : "slots"}`
                                                    : "No open slots"}
                                            </span>
                                        </div>
                                    </article>
                                ),
                            )}
                        </div>
                    )}
                </section>
            </div>
        );
    }

    function renderAppointments() {
        const now = new Date();
        const consultationTypes = [...new Set(
            appointments
                .map((appointment) =>
                    appointment.appointmentType ||
                    appointment.timeSlot?.appointmentType,
                )
                .filter(Boolean),
        )].sort((first, second) => first.localeCompare(second));
        const filteredAppointments = appointments.filter((appointment) => {
            const consultationType =
                appointment.appointmentType ||
                appointment.timeSlot?.appointmentType;
            const date = appointment.timeSlot?.slotDate;
            const typeMatches =
                appointmentTypeFilter === "ALL" ||
                consultationType === appointmentTypeFilter;
            const fromMatches =
                !appointmentDateFrom ||
                Boolean(date && date >= appointmentDateFrom);
            const toMatches =
                !appointmentDateTo ||
                Boolean(date && date <= appointmentDateTo);
            return typeMatches && fromMatches && toMatches;
        });

        const startOf = (appointment) =>
            getSlotTime(
                appointment.timeSlot,
                appointment.timeSlot?.startTime,
            )?.getTime() || 0;

        const upcoming = filteredAppointments
            .filter((appointment) =>
                isUpcomingAppointment(appointment, now),
            )
            .sort((first, second) => startOf(first) - startOf(second));

        const past = filteredAppointments
            .filter(
                (appointment) =>
                    !isUpcomingAppointment(appointment, now),
            )
            .sort((first, second) => startOf(second) - startOf(first));

        const visible =
            appointmentView === "upcoming" ? upcoming : past;

        return (
            <>
                <nav className="admin-navigation">
                    <button
                        type="button"
                        className={
                            appointmentView === "upcoming"
                                ? "booking-tab active"
                                : "booking-tab"
                        }
                        onClick={() =>
                            setAppointmentView("upcoming")
                        }
                    >
                        Upcoming ({upcoming.length})
                    </button>

                    <button
                        type="button"
                        className={
                            appointmentView === "past"
                                ? "booking-tab active"
                                : "booking-tab"
                        }
                        onClick={() => setAppointmentView("past")}
                    >
                        Past ({past.length})
                    </button>
                </nav>

                <div className="admin-list-filters" aria-label="Filter appointments">
                    <label>
                        <span>Consultation type</span>
                        <select value={appointmentTypeFilter} onChange={(event) => setAppointmentTypeFilter(event.target.value)}>
                            <option value="ALL">All consultation types</option>
                            {consultationTypes.map((type) => <option value={type} key={type}>{type}</option>)}
                        </select>
                    </label>
                    <label>
                        <span>From date</span>
                        <input type="date" value={appointmentDateFrom} max={appointmentDateTo || undefined} onChange={(event) => setAppointmentDateFrom(event.target.value)} />
                    </label>
                    <label>
                        <span>To date</span>
                        <input type="date" value={appointmentDateTo} min={appointmentDateFrom || undefined} onChange={(event) => setAppointmentDateTo(event.target.value)} />
                    </label>
                    {(appointmentTypeFilter !== "ALL" || appointmentDateFrom || appointmentDateTo) && (
                        <button type="button" onClick={() => { setAppointmentTypeFilter("ALL"); setAppointmentDateFrom(""); setAppointmentDateTo(""); }}>Clear filters</button>
                    )}
                </div>

                {visible.length === 0 ? (
                    <p className="empty-message">No appointments match these filters.</p>
                ) : (
                    <div className="admin-record-list">
                        {visible.map((appointment) => {
                            const status =
                                appointment.status || "PENDING";

                            const student = appointment.student;
                            const slot = appointment.timeSlot;

                            const itemKey =
                                `appointment-${appointment.appointmentId}`;

                            const busy = workingItem === itemKey;

                            return (
                                <article
                                    className={
                                        "admin-record-card " +
                                        "appointment-admin-card"
                                    }
                                    key={appointment.appointmentId}
                                >
                                    <div>
                                        <strong>
                                            {appointment.appointmentType}
                                        </strong>

                                        <span>
                                            {student?.firstName}{" "}
                                            {student?.lastName}
                                        </span>

                                        <span>
                                            {slot?.slotDate}
                                            {" · "}
                                            {slot?.startTime}
                                            {" – "}
                                            {slot?.endTime}
                                        </span>

                                        <span
                                            className={
                                                `appointment-status ` +
                                                status.toLowerCase()
                                            }
                                        >
                                            {STATUS_LABELS[status] ||
                                                status}
                                        </span>
                                    </div>

                                    <div className="admin-card-actions">
                                        {(status === "PENDING" ||
                                            status === "RESCHEDULED") && (
                                            <button
                                                type="button"
                                                className="primary-button"
                                                disabled={busy}
                                                onClick={() =>
                                                    handleAppointmentStatus(
                                                        appointment.appointmentId,
                                                        "CONFIRMED",
                                                    )
                                                }
                                            >
                                                {busy
                                                    ? "Updating..."
                                                    : "Confirm"}
                                            </button>
                                        )}

                                        {status === "CONFIRMED" && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="complete-button"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        handleAppointmentStatus(
                                                            appointment.appointmentId,
                                                            "COMPLETED",
                                                        )
                                                    }
                                                >
                                                    {busy
                                                        ? "Updating..."
                                                        : "Attended"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger-button"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        handleAppointmentStatus(
                                                            appointment.appointmentId,
                                                            "NO_SHOW",
                                                        )
                                                    }
                                                >
                                                    No-show
                                                </button>
                                            </>
                                        )}

                                        {isActiveStatus(status) && (
                                            <button
                                                type="button"
                                                className="danger-button"
                                                disabled={busy}
                                                onClick={() =>
                                                    handleAppointmentStatus(
                                                        appointment.appointmentId,
                                                        "CANCELLED",
                                                    )
                                                }
                                            >
                                                Cancel
                                            </button>
                                        )}

                                        {!isActiveStatus(status) &&
                                            status !== "COMPLETED" && (
                                            <button
                                                type="button"
                                                className="danger-button"
                                                disabled={busy}
                                                onClick={() =>
                                                    handleDeleteAppointment(
                                                        appointment.appointmentId,
                                                    )
                                                }
                                            >
                                                {busy
                                                    ? "Removing..."
                                                    : "Remove"}
                                            </button>
                                        )}

                                        {status === "COMPLETED" && (
                                            <span className="admin-retained-note">
                                                Retained for rewards and audit history
                                            </span>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </>
        );
    }

    function renderTimeSlots() {
        // A closed slot has no active booking; a booked slot does.
        const bookedSlotIds = new Set(
            appointments
                .filter((appointment) =>
                    isActiveStatus(appointment.status),
                )
                .map((appointment) =>
                    String(appointment.timeSlot?.slotId),
                ),
        );
        const getState = (slot) => {
            if (slot.available) return "AVAILABLE";
            return bookedSlotIds.has(String(slot.slotId))
                ? "BOOKED"
                : "CLOSED";
        };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const plusDays = (days) => {
            const date = new Date(today);
            date.setDate(date.getDate() + days);
            return date;
        };
        const minusDays = (days) => {
            const date = new Date(today);
            date.setDate(date.getDate() - days);
            return date;
        };
        const filteredSlots = timeSlots.filter((slot) => {
            const stateMatches =
                slotAvailabilityFilter === "ALL" ||
                getState(slot) === slotAvailabilityFilter;
            const date = slot.slotDate
                ? new Date(`${slot.slotDate}T00:00:00`)
                : null;
            let periodMatches = slotPeriodFilter === "ALL";
            if (date && !Number.isNaN(date.getTime())) {
                if (slotPeriodFilter === "UPCOMING") periodMatches = date >= today;
                if (slotPeriodFilter === "NEXT_7") periodMatches = date >= today && date <= plusDays(7);
                if (slotPeriodFilter === "NEXT_30") periodMatches = date >= today && date <= plusDays(30);
                if (slotPeriodFilter === "RECENT_7") periodMatches = date >= minusDays(7) && date <= today;
                if (slotPeriodFilter === "PAST") periodMatches = date < today;
            }
            return stateMatches && periodMatches;
        });
        const sortedSlots = [...filteredSlots].sort((first, second) => {
            const dateOrder = String(first.slotDate || "").localeCompare(
                String(second.slotDate || ""),
            );
            return dateOrder || String(first.startTime || "").localeCompare(
                String(second.startTime || ""),
            );
        });
        const groupedSlots = sortedSlots.reduce((groups, slot) => {
            const dateKey = slot.slotDate || "Date unavailable";
            if (!groups.has(dateKey)) groups.set(dateKey, []);
            groups.get(dateKey).push(slot);
            return groups;
        }, new Map());
        let dateGroups = [...groupedSlots.entries()];
        if (slotPeriodFilter === "PAST" || slotPeriodFilter === "RECENT_7") {
            dateGroups = dateGroups.reverse();
        }

        return (
            <>
                <header className="admin-section-toolbar">
                    <div><h2>Time-slot schedule</h2><span>{filteredSlots.length} of {timeSlots.length} slots</span></div>
                    <div className="admin-list-filters admin-list-filters--slots" aria-label="Filter time slots">
                        <label>
                            <span>Availability</span>
                            <select value={slotAvailabilityFilter} onChange={(event) => setSlotAvailabilityFilter(event.target.value)}>
                                <option value="ALL">All states</option>
                                <option value="AVAILABLE">Available</option>
                                <option value="BOOKED">Booked</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </label>
                        <label>
                            <span>Date period</span>
                            <select value={slotPeriodFilter} onChange={(event) => setSlotPeriodFilter(event.target.value)}>
                                <option value="UPCOMING">Upcoming</option>
                                <option value="NEXT_7">Next 7 days</option>
                                <option value="NEXT_30">Next 30 days</option>
                                <option value="RECENT_7">Recent 7 days</option>
                                <option value="PAST">Past</option>
                                <option value="ALL">All dates</option>
                            </select>
                        </label>
                    </div>
                </header>

                {timeSlots.length === 0 ? (
                    <p className="empty-message">No time slots found.</p>
                ) : dateGroups.length === 0 ? (
                    <p className="empty-message">No time slots match these filters.</p>
                ) : (
                    <div className="admin-slot-groups">
                        {dateGroups.map(([date, slots]) => (
                            <section className="admin-slot-group" key={date}>
                                <header><h3>{formatAdminDate(date)}</h3><span>{slots.length} slot{slots.length === 1 ? "" : "s"}</span></header>
                                <div className="admin-record-list">
                                    {slots.map((slot) => {
                                        const itemKey = `slot-${slot.slotId}`;
                                        const isBooked = bookedSlotIds.has(String(slot.slotId));
                                        const state = getState(slot);
                                        const stateClass = state === "AVAILABLE" ? "available" : state === "BOOKED" ? "booked" : "unavailable";
                                        const stateLabel = state === "AVAILABLE" ? "Available" : state === "BOOKED" ? "Booked" : "Closed";

                                        return (
                                            <article className="admin-record-card admin-slot-card" key={slot.slotId}>
                                                <div>
                                                    <strong>{slot.appointmentType || "Clinic appointment"}</strong>
                                                    <span className="admin-slot-card__time">{slot.startTime} – {slot.endTime}</span>
                                                    <span>{slot.staffName || `Slot ID: ${slot.slotId}`}</span>
                                                    <span>{slot.roomNumber || "Room not assigned"} · {slot.estimatedDurationMinutes} minutes</span>
                                                    <span className={`slot-status ${stateClass}`}>{stateLabel}</span>
                                                </div>

                                                {!isBooked && (
                                                    <div className="admin-card-actions">
                                                        <button type="button" className="primary-button" disabled={workingItem === itemKey} onClick={() => handleSlotAvailability(slot.slotId, !slot.available)}>
                                                            {slot.available ? "Close slot" : "Open slot"}
                                                        </button>
                                                        {slot.available && (
                                                            <button type="button" className="danger-button" disabled={workingItem === itemKey} onClick={() => handleDeleteSlot(slot.slotId)}>Delete</button>
                                                        )}
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </>
        );
    }

    const notifications = adminNotifications(appointments, timeSlots);
    const sidebarItems = [
        { section: "overview", label: "Dashboard", icon: "overview" },
        { section: "users", label: "User records", icon: "users" },
        { section: "appointments", label: "Appointments", icon: "appointments" },
        { section: "slots", label: "Time slots", icon: "slots" },
        { section: "sick-notes", label: "Sick Notes", icon: "sick-notes" },
        {
            section: "create-staff",
            label: "Create staff account",
            icon: "create",
            className: "dashboard-sidebar__create",
        },
    ];
    const menuItems = sidebarItems.map((item) =>
        item.to
            ? { label: item.label, to: item.to }
            : {
                label: item.label,
                active: activeSection === item.section,
                onSelect: () => setActiveSection(item.section),
            },
    );
    menuItems.push({ label: "Home", to: "/" });

    const sectionDetails = {
        overview: ["Dashboard", ""],
        users: ["User Records", "Manage student, clinic staff and administrator accounts."],
        appointments: ["Appointments", "Manage upcoming and historical clinic bookings."],
        slots: ["Time Slots", "Open, close and maintain clinic availability."],
        "sick-notes": ["Sick Notes", "Review student medical sick-note requests."],
        "create-staff": ["Create Staff Account", "Add a clinic staff member securely."],
    };
    const [sectionTitle, sectionSubtitle] = sectionDetails[activeSection];

    return (
        <main className="student-dashboard dashboard-shell admin-dashboard">
            <DashboardSidebar
                activeSection={activeSection}
                ariaLabel="Administrator dashboard navigation"
                items={sidebarItems}
                onSelect={setActiveSection}
                onSignOut={handleLogout}
            />

            <div className="dashboard-workspace admin-workspace">
                <ResponsiveHeader
                    ariaLabel="Administrator dashboard navigation"
                    desktopSignOut={false}
                    identity={{
                        name: `${user.firstName || "Administrator"} ${user.lastName || ""}`.trim(),
                        detail: "Administrator",
                    }}
                    menuItems={menuItems}
                    notificationKey={`admin-${user.userId}`}
                    notifications={notifications}
                    onNotificationSelect={(notification) => setActiveSection(notification.section)}
                    onSignOut={handleLogout}
                    showLogo={false}
                    title={sectionTitle}
                    subtitle={sectionSubtitle}
                />

                <div className="dashboard-content admin-dashboard-content">
                    {activeSection === "overview" && (
                        <section className="admin-welcome-banner">
                            <p className="eyebrow">ADMINISTRATION</p>
                            <h1>PulseUp system management</h1>
                            <p>Monitor clinic activity, users, bookings and service availability.</p>
                        </section>
                    )}

                    {activeSection === "overview" && (
                        <section className="admin-summary-grid">
                            <article><span>Students</span><strong>{students.length}</strong></article>
                            <article><span>Staff</span><strong>{staff.length}</strong></article>
                            <article><span>Appointments</span><strong>{appointments.length}</strong></article>
                            <article><span>Time slots</span><strong>{timeSlots.length}</strong></article>
                        </section>
                    )}

                    {message && <p className="dashboard-message">{message}</p>}

                    <section className="admin-content">
                        <article className="dashboard-panel">
                            {loading ? (
                                <p>Loading administration records...</p>
                            ) : (
                                <>
                                    {activeSection === "overview" && renderOverview()}
                                    {activeSection === "users" && renderUsers()}
                                    {activeSection === "appointments" && renderAppointments()}
                                    {activeSection === "slots" && renderTimeSlots()}
                                    {activeSection === "sick-notes" && <SickNoteReviewPanel mode="admin" />}
                                    {activeSection === "create-staff" && (
                                        <AdminStaffCreationForm
                                            onCreated={() => loadDashboardData(true)}
                                        />
                                    )}
                                </>
                            )}
                        </article>
                    </section>
                </div>
            </div>
        </main>
    );
}

export default AdminDashboard;