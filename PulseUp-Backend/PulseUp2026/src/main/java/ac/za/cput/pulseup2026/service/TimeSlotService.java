package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.AppointmentType;
import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.domain.TimeSlot;
import ac.za.cput.pulseup2026.factory.TimeSlotFactory;
import ac.za.cput.pulseup2026.repository.AppointmentRepository;
import ac.za.cput.pulseup2026.repository.StaffRepository;
import ac.za.cput.pulseup2026.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class TimeSlotService {

    private static final ZoneId CAMPUS_ZONE =
            ZoneId.of("Africa/Johannesburg");

    private static final Set<String>
            ACTIVE_RESERVATION_STATUSES = Set.of(
                    "PENDING",
                    "RESCHEDULED",
                    "CONFIRMED"
            );

    private final TimeSlotRepository timeSlotRepository;
    private final StaffRepository staffRepository;
    private final AppointmentRepository appointmentRepository;

    public TimeSlotService(
            TimeSlotRepository timeSlotRepository,
            StaffRepository staffRepository,
            AppointmentRepository appointmentRepository
    ) {
        this.timeSlotRepository = timeSlotRepository;
        this.staffRepository = staffRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public TimeSlot createTimeSlot(
            Long staffId,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime,
            String appointmentType,
            String roomNumber,
            int estimatedDurationMinutes
    ) {
        if (staffId == null) {
            return null;
        }

        Staff staff = staffRepository.findById(staffId)
                .orElse(null);

        if (staff == null || !isFutureSlot(slotDate, startTime)) {
            return null;
        }

        TimeSlot slot = TimeSlotFactory.createTimeSlot(
                staff,
                slotDate,
                startTime,
                endTime,
                appointmentType,
                roomNumber,
                estimatedDurationMinutes
        );

        return slot == null
                ? null
                : timeSlotRepository.save(slot);
    }

    @Transactional(readOnly = true)
    public TimeSlot getTimeSlotById(Long id) {
        return id == null
                ? null
                : timeSlotRepository.findById(id).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<TimeSlot> getAllTimeSlots() {
        return timeSlotRepository
                .findAllByOrderBySlotDateAscStartTimeAsc();
    }

    @Transactional(readOnly = true)
    public List<TimeSlot> getAvailableFutureTimeSlots() {
        return futureAvailable(
                timeSlotRepository
                        .findAllByOrderBySlotDateAscStartTimeAsc()
        );
    }

    @Transactional(readOnly = true)
    public List<TimeSlot> getAvailableTimeSlotsByType(
            String value
    ) {
        AppointmentType type = AppointmentType.fromValue(value);

        if (type == null) {
            return List.of();
        }

        return futureAvailable(
                timeSlotRepository
                        .findByAvailableTrueAndAppointmentTypeAndStaff_DepartmentIgnoreCaseOrderBySlotDateAscStartTimeAsc(
                                type.getDisplayName(),
                                type.getRequiredDepartment()
                        )
        );
    }

    public TimeSlot updateTimeSlot(
            Long slotId,
            Long staffId,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime,
            String appointmentTypeValue,
            String roomNumber,
            int estimatedDurationMinutes
    ) {
        if (slotId == null || staffId == null) {
            return null;
        }

        TimeSlot existing = timeSlotRepository
                .findById(slotId)
                .orElse(null);
        Staff staff = staffRepository
                .findById(staffId)
                .orElse(null);
        AppointmentType type = AppointmentType.fromValue(
                appointmentTypeValue
        );

        if (
                existing == null ||
                        staff == null ||
                        slotDate == null ||
                        startTime == null ||
                        endTime == null ||
                        !isFutureSlot(slotDate, startTime) ||
                        roomNumber == null ||
                        roomNumber.isBlank() ||
                        estimatedDurationMinutes <= 0 ||
                        estimatedDurationMinutes > 180 ||
                        !startTime.isBefore(endTime) ||
                        type == null ||
                        !type.isAllowedForDepartment(
                                staff.getDepartment()
                        )
        ) {
            return null;
        }

        existing.updateDetails(
                staff,
                slotDate,
                startTime,
                endTime,
                type.getDisplayName(),
                roomNumber.trim(),
                estimatedDurationMinutes
        );
        return timeSlotRepository.save(existing);
    }

    public TimeSlot setAvailability(
            Long slotId,
            boolean available
    ) {
        TimeSlot slot = getTimeSlotById(slotId);

        if (slot == null) {
            return null;
        }

        if (
                available &&
                        appointmentRepository
                                .existsByTimeSlot_SlotIdAndStatusIn(
                                        slotId,
                                        ACTIVE_RESERVATION_STATUSES
                                )
        ) {
            return null;
        }

        slot.setAvailable(available);
        return timeSlotRepository.save(slot);
    }

    public boolean deleteTimeSlot(Long id) {
        if (
                id == null ||
                        !timeSlotRepository.existsById(id) ||
                        appointmentRepository
                                .existsByTimeSlot_SlotId(id)
        ) {
            return false;
        }

        timeSlotRepository.deleteById(id);
        return true;
    }

    @Transactional(readOnly = true)
    public List<TimeSlot> getTimeSlotsByStaffId(Long staffId) {
        return staffId == null
                ? List.of()
                : timeSlotRepository
                        .findByStaff_UserIdOrderBySlotDateAscStartTimeAsc(
                                staffId
                        );
    }

    private boolean isFutureSlot(
            LocalDate slotDate,
            LocalTime startTime
    ) {
        if (slotDate == null || startTime == null) {
            return false;
        }

        ZonedDateTime now = ZonedDateTime.now(CAMPUS_ZONE);
        return slotDate.isAfter(now.toLocalDate()) ||
                (
                        slotDate.isEqual(now.toLocalDate()) &&
                                startTime.isAfter(now.toLocalTime())
                );
    }

    private List<TimeSlot> futureAvailable(
            List<TimeSlot> slots
    ) {
        ZonedDateTime now = ZonedDateTime.now(CAMPUS_ZONE);
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        return slots.stream()
                .filter(TimeSlot::isAvailable)
                .filter(slot ->
                        slot.getSlotDate().isAfter(today) ||
                                (
                                        slot.getSlotDate().isEqual(today) &&
                                                slot.getStartTime()
                                                        .isAfter(currentTime)
                                )
                )
                .toList();
    }
}
