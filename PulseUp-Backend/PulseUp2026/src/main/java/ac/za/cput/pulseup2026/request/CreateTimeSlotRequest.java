package ac.za.cput.pulseup2026.request;

import java.time.LocalDate;
import java.time.LocalTime;

public class CreateTimeSlotRequest {

    private Long staffId;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String appointmentType;
    private String roomNumber;
    private int estimatedDurationMinutes = 20;

    public CreateTimeSlotRequest() {
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public LocalDate getSlotDate() {
        return slotDate;
    }

    public void setSlotDate(LocalDate slotDate) {
        this.slotDate = slotDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getAppointmentType() {
        return appointmentType;
    }

    public void setAppointmentType(String appointmentType) {
        this.appointmentType = appointmentType;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public int getEstimatedDurationMinutes() {
        return estimatedDurationMinutes;
    }

    public void setEstimatedDurationMinutes(
            int estimatedDurationMinutes
    ) {
        this.estimatedDurationMinutes =
                estimatedDurationMinutes;
    }
}
