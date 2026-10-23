package ac.za.cput.pulseup2026.response;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentQueueResponse(
        Long appointmentId,
        String appointmentType,
        String status,
        String notes,

        LocalDate slotDate,
        LocalTime startTime,
        LocalTime endTime,

        Long staffId,
        String staffName,
        String staffDepartment,
        String staffPosition,
        String staffSpecialization,

        String roomNumber,
        int estimatedDurationMinutes,

        int queuePosition,
        int estimatedWaitMinutes
) {
}