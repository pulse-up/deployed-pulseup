package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.Appointment;
import ac.za.cput.pulseup2026.domain.AppointmentStatus;
import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.domain.TimeSlot;
import ac.za.cput.pulseup2026.factory.AppointmentFactory;
import ac.za.cput.pulseup2026.repository.AppointmentRepository;
import ac.za.cput.pulseup2026.repository.StudentRepository;
import ac.za.cput.pulseup2026.repository.TimeSlotRepository;
import ac.za.cput.pulseup2026.response.AppointmentQueueResponse;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AppointmentService {

    private static final int MAX_NOTES_LENGTH = 255;

    private static final Set<String> QUEUE_STATUSES =
            Set.of(
                    "PENDING",
                    "RESCHEDULED",
                    "CONFIRMED"
            );

    private final AppointmentRepository
            appointmentRepository;

    private final StudentRepository
            studentRepository;

    private final TimeSlotRepository
            timeSlotRepository;

    private final HealthPointService
            healthPointService;

    private final EntityManager entityManager;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            StudentRepository studentRepository,
            TimeSlotRepository timeSlotRepository,
            HealthPointService healthPointService,
            EntityManager entityManager
    ) {
        this.appointmentRepository =
                appointmentRepository;

        this.studentRepository =
                studentRepository;

        this.timeSlotRepository =
                timeSlotRepository;

        this.healthPointService =
                healthPointService;

        this.entityManager = entityManager;
    }

    @Transactional
    public Appointment createAppointment(
            Long studentId,
            Long slotId,
            String notes
    ) {
        if (studentId == null || slotId == null) {
            return null;
        }

        String cleanedNotes = notes == null
                ? null
                : notes.trim();

        if (
                cleanedNotes != null &&
                        cleanedNotes.length() > MAX_NOTES_LENGTH
        ) {
            return null;
        }

        if (cleanedNotes != null && cleanedNotes.isEmpty()) {
            cleanedNotes = null;
        }

        Student student = studentRepository
                .findById(studentId)
                .orElse(null);

        TimeSlot timeSlot = timeSlotRepository
                .findById(slotId)
                .orElse(null);

        if (student == null || !student.isActive()) {
            return null;
        }

        if (timeSlot == null || !timeSlot.isAvailable()) {
            throw new SlotUnavailableException();
        }

        Appointment appointment =
                AppointmentFactory.createAppointment(
                        student,
                        timeSlot,
                        cleanedNotes
                );

        if (appointment == null) {
            return null;
        }

        if (timeSlotRepository.reserveIfAvailable(slotId) != 1) {
            throw new SlotUnavailableException();
        }

        entityManager.refresh(timeSlot);
        timeSlot.reserve();

        return appointmentRepository.save(
                appointment
        );
    }

    @Transactional(readOnly = true)
    public Appointment getAppointmentById(
            Long id
    ) {
        if (id == null) {
            return null;
        }

        return appointmentRepository
                .findDetailedById(id)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<Appointment>
    getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Appointment>
    getAppointmentsByStudentId(
            Long studentId
    ) {
        if (studentId == null) {
            return List.of();
        }

        return appointmentRepository
                .findAppointmentsForStudent(
                        studentId
                );
    }

    @Transactional(readOnly = true)
    public List<Appointment>
    getAppointmentsByStaffId(
            Long staffId
    ) {
        if (staffId == null) {
            return List.of();
        }

        return appointmentRepository
                .findAppointmentsForStaff(
                        staffId
                );
    }

    @Transactional(readOnly = true)
    public List<AppointmentQueueResponse>
    getQueueForStudent(Long studentId) {
        if (studentId == null) {
            return List.of();
        }

        return getAppointmentsByStudentId(
                studentId
        )
                .stream()
                .map(this::toQueueResponse)
                .toList();
    }

    @Transactional
    public Appointment updateAppointmentStatus(
            Long appointmentId,
            String status,
            Long staffId,
            boolean adminUser
    ) {
        if (
                appointmentId == null ||
                        status == null ||
                        status.isBlank()
        ) {
            return null;
        }

        Appointment appointment =
                getAppointmentById(
                        appointmentId
                );

        if (appointment == null) {
            return null;
        }

        if (
                !adminUser &&
                        !belongsToStaff(
                                appointment,
                                staffId
                        )
        ) {
            return null;
        }

        AppointmentStatus parsedStatus;
        try {
            parsedStatus = AppointmentStatus.valueOf(
                    status.trim().toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException exception) {
            return null;
        }

        if (!EnumSet.of(
                AppointmentStatus.PENDING,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.COMPLETED,
                AppointmentStatus.NO_SHOW
        ).contains(parsedStatus)) {
            return null;
        }

        String normalisedStatus = parsedStatus.name();

        /*
         * A completed appointment becomes a permanent
         * health reward record and cannot be reopened.
         */
        if (
                "COMPLETED".equals(
                        appointment.getStatus()
                )
        ) {
            if (
                    "COMPLETED".equals(
                            normalisedStatus
                    )
            ) {
                return appointment;
            }

            return null;
        }

        appointment.updateStatus(
                normalisedStatus
        );

        Appointment savedAppointment =
                appointmentRepository
                        .saveAndFlush(
                                appointment
                        );

        if (
                "COMPLETED".equals(
                        normalisedStatus
                )
        ) {
            healthPointService
                    .awardForCompletedAppointment(
                            savedAppointment
                    );
        }

        return savedAppointment;
    }

    @Transactional
    public Appointment cancelAppointment(
            Long appointmentId,
            Long studentId,
            boolean adminUser
    ) {
        Appointment appointment =
                getAppointmentById(
                        appointmentId
                );

        if (appointment == null) {
            return null;
        }

        if (
                "COMPLETED".equals(
                        appointment.getStatus()
                )
        ) {
            return null;
        }

        if (
                !adminUser &&
                        !belongsToStudent(
                                appointment,
                                studentId
                        )
        ) {
            return null;
        }

        if (
                !"CANCELLED".equals(
                        appointment.getStatus()
                )
        ) {
            appointment.cancel();

            timeSlotRepository.save(
                    appointment.getTimeSlot()
            );
        }

        return appointmentRepository.save(
                appointment
        );
    }

    @Transactional
    public Appointment rescheduleAppointment(
            Long appointmentId,
            Long newSlotId,
            Long studentId,
            boolean adminUser
    ) {
        if (
                appointmentId == null ||
                        newSlotId == null
        ) {
            return null;
        }

        Appointment appointment =
                getAppointmentById(
                        appointmentId
                );

        TimeSlot newTimeSlot =
                timeSlotRepository
                        .findById(newSlotId)
                        .orElse(null);

        if (
                appointment == null ||
                        "CANCELLED".equals(
                                appointment.getStatus()
                        ) ||
                        "COMPLETED".equals(
                                appointment.getStatus()
                        )
        ) {
            return null;
        }

        if (newTimeSlot == null || !newTimeSlot.isAvailable()) {
            throw new SlotUnavailableException();
        }

        if (
                !adminUser &&
                        !belongsToStudent(
                                appointment,
                                studentId
                        )
        ) {
            return null;
        }

        TimeSlot oldTimeSlot =
                appointment.getTimeSlot();

        if (
                oldTimeSlot
                        .getSlotId()
                        .equals(
                                newTimeSlot.getSlotId()
                        )
        ) {
            return null;
        }

        if (timeSlotRepository.reserveIfAvailable(newSlotId) != 1) {
            throw new SlotUnavailableException();
        }

        entityManager.refresh(newTimeSlot);
        newTimeSlot.reserve();

        appointment.reschedule(
                newTimeSlot
        );

        timeSlotRepository.save(
                oldTimeSlot
        );

        return appointmentRepository.save(
                appointment
        );
    }

    @Transactional
    public boolean deleteAppointment(
            Long id
    ) {
        Appointment appointment =
                getAppointmentById(id);

        if (appointment == null) {
            return false;
        }

        /*
         * Completed appointments are retained because
         * they are linked to point transactions.
         */
        if (
                "COMPLETED".equals(
                        appointment.getStatus()
                )
        ) {
            return false;
        }

        if (
                !"CANCELLED".equals(
                        appointment.getStatus()
                )
        ) {
            appointment
                    .getTimeSlot()
                    .release();

            timeSlotRepository.save(
                    appointment.getTimeSlot()
            );
        }

        appointmentRepository.delete(
                appointment
        );

        return true;
    }

    @Transactional(readOnly = true)
    public boolean canViewAppointment(
            Appointment appointment,
            Long userId,
            boolean studentUser,
            boolean staffUser,
            boolean adminUser
    ) {
        if (
                appointment == null ||
                        userId == null
        ) {
            return false;
        }

        if (adminUser) {
            return true;
        }

        if (
                studentUser &&
                        belongsToStudent(
                                appointment,
                                userId
                        )
        ) {
            return true;
        }

        return staffUser &&
                belongsToStaff(
                        appointment,
                        userId
                );
    }

    private AppointmentQueueResponse
    toQueueResponse(
            Appointment appointment
    ) {
        TimeSlot timeSlot =
                appointment.getTimeSlot();

        Staff staff =
                timeSlot.getStaff();

        int queuePosition = 0;
        int estimatedWaitMinutes = 0;

        if (
                "CONFIRMED".equals(
                        appointment.getStatus()
                )
        ) {
            List<Appointment> queue =
                    appointmentRepository
                            .findQueueForStaffAndDate(
                                    staff.getUserId(),
                                    timeSlot.getSlotDate()
                            );

            for (
                    Appointment queueAppointment :
                    queue
            ) {
                if (
                        !QUEUE_STATUSES.contains(
                                queueAppointment
                                        .getStatus()
                        )
                ) {
                    continue;
                }

                queuePosition++;

                if (
                        queueAppointment
                                .getAppointmentId()
                                .equals(
                                        appointment
                                                .getAppointmentId()
                                )
                ) {
                    break;
                }

                estimatedWaitMinutes +=
                        Math.max(
                                1,
                                queueAppointment
                                        .getTimeSlot()
                                        .getEstimatedDurationMinutes()
                        );
            }
        }

        return new AppointmentQueueResponse(
                appointment.getAppointmentId(),
                timeSlot.getSlotId(),
                appointment.getAppointmentType(),
                appointment.getStatus(),
                appointment.getNotes(),

                timeSlot.getSlotDate(),
                timeSlot.getStartTime(),
                timeSlot.getEndTime(),

                staff.getUserId(),
                staff.getFirstName()
                        + " "
                        + staff.getLastName(),

                staff.getDepartment(),
                staff.getPosition(),
                staff.getSpecialization(),

                timeSlot.getRoomNumber(),
                timeSlot
                        .getEstimatedDurationMinutes(),

                queuePosition,
                estimatedWaitMinutes
        );
    }

    private boolean belongsToStudent(
            Appointment appointment,
            Long studentId
    ) {
        return studentId != null &&
                appointment
                        .getStudent()
                        .isActive() &&
                appointment
                        .getStudent()
                        .getUserId()
                        .equals(studentId);
    }

    private boolean belongsToStaff(
            Appointment appointment,
            Long staffId
    ) {
        return staffId != null &&
                appointment
                        .getTimeSlot()
                        .getStaff()
                        .getUserId()
                        .equals(staffId);
    }
}