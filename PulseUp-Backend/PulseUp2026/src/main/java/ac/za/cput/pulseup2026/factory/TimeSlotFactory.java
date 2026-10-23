package ac.za.cput.pulseup2026.factory;

import ac.za.cput.pulseup2026.domain.AppointmentType;
import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.domain.TimeSlot;

import java.time.LocalDate;
import java.time.LocalTime;

public final class TimeSlotFactory {

    private TimeSlotFactory() {
    }

    public static TimeSlot createTimeSlot(
            Staff staff,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime,
            String appointmentTypeValue,
            String roomNumber,
            int estimatedDurationMinutes
    ) {
        if (staff == null
                || slotDate == null
                || startTime == null
                || endTime == null
                || isBlank(roomNumber)
                || estimatedDurationMinutes <= 0
                || estimatedDurationMinutes > 180
                || !startTime.isBefore(endTime)) {
            return null;
        }

        AppointmentType appointmentType =
                AppointmentType.fromValue(
                        appointmentTypeValue
                );

        if (appointmentType == null
                || !appointmentType.isAllowedForDepartment(
                staff.getDepartment())) {
            return null;
        }

        return TimeSlot.builder()
                .staff(staff)
                .slotDate(slotDate)
                .startTime(startTime)
                .endTime(endTime)
                .appointmentType(
                        appointmentType.getDisplayName()
                )
                .roomNumber(roomNumber.trim())
                .estimatedDurationMinutes(
                        estimatedDurationMinutes
                )
                .available(true)
                .build();
    }

    /*
     * Retained so any older tests still compile.
     * New code must use the method above.
     */
    public static TimeSlot createTimeSlot(
            Staff staff,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime
    ) {
        if (staff == null
                || slotDate == null
                || startTime == null
                || endTime == null
                || !startTime.isBefore(endTime)) {
            return null;
        }

        return TimeSlot.builder()
                .staff(staff)
                .slotDate(slotDate)
                .startTime(startTime)
                .endTime(endTime)
                .appointmentType(
                        "General Consultation"
                )
                .roomNumber("To be assigned")
                .estimatedDurationMinutes(20)
                .available(true)
                .build();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}