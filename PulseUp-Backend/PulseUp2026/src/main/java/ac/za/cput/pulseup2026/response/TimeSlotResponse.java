package ac.za.cput.pulseup2026.response;

import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.domain.TimeSlot;

import java.time.LocalDate;
import java.time.LocalTime;

public record TimeSlotResponse(
        Long slotId,
        Long staffId,
        String staffName,
        LocalDate slotDate,
        LocalTime startTime,
        LocalTime endTime,
        String appointmentType,
        String roomNumber,
        int estimatedDurationMinutes,
        boolean available
) {
    public static TimeSlotResponse from(TimeSlot slot) {
        if (slot == null) {
            return null;
        }

        Staff staff = slot.getStaff();
        String staffName = staff == null
                ? null
                : (staff.getFirstName() + " " + staff.getLastName()).trim();

        return new TimeSlotResponse(
                slot.getSlotId(),
                staff == null ? null : staff.getUserId(),
                staffName,
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getAppointmentType(),
                slot.getRoomNumber(),
                slot.getEstimatedDurationMinutes(),
                slot.isAvailable()
        );
    }
}
