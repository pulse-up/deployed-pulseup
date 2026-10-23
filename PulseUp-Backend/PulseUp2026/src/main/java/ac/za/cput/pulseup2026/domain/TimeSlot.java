package ac.za.cput.pulseup2026.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "time_slots")
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long slotId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(
            name = "appointment_type",
            nullable = false,
            columnDefinition =
                    "varchar(100) default 'General Consultation'"
    )
    private String appointmentType = "General Consultation";

    @Column(
            name = "room_number",
            nullable = false,
            columnDefinition =
                    "varchar(50) default 'To be assigned'"
    )
    private String roomNumber = "To be assigned";

    @Column(
            name = "estimated_duration_minutes",
            nullable = false,
            columnDefinition = "int default 20"
    )
    private int estimatedDurationMinutes = 20;

    @Column(nullable = false)
    private boolean available = true;

    protected TimeSlot() {
    }

    private TimeSlot(Builder builder) {
        this.staff = builder.staff;
        this.slotDate = builder.slotDate;
        this.startTime = builder.startTime;
        this.endTime = builder.endTime;
        this.appointmentType = builder.appointmentType;
        this.roomNumber = builder.roomNumber;
        this.estimatedDurationMinutes =
                builder.estimatedDurationMinutes;
        this.available = builder.available;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getSlotId() {
        return slotId;
    }

    public Staff getStaff() {
        return staff;
    }

    public LocalDate getSlotDate() {
        return slotDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public String getAppointmentType() {
        return appointmentType;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public int getEstimatedDurationMinutes() {
        return estimatedDurationMinutes;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    /*
     * Use this version when staff can also update
     * appointment type, room and estimated duration.
     */
    public void updateDetails(
            Staff staff,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime,
            String appointmentType,
            String roomNumber,
            int estimatedDurationMinutes
    ) {
        this.staff = staff;
        this.slotDate = slotDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.appointmentType = appointmentType;
        this.roomNumber = roomNumber;
        this.estimatedDurationMinutes =
                estimatedDurationMinutes;
    }

    public void reserve() {
        this.available = false;
    }

    public void release() {
        this.available = true;
    }

    public static class Builder {

        private Staff staff;
        private LocalDate slotDate;
        private LocalTime startTime;
        private LocalTime endTime;

        private String appointmentType =
                "General Consultation";

        private String roomNumber = "To be assigned";

        private int estimatedDurationMinutes = 20;

        private boolean available = true;

        public Builder staff(Staff staff) {
            this.staff = staff;
            return this;
        }

        public Builder slotDate(LocalDate slotDate) {
            this.slotDate = slotDate;
            return this;
        }

        public Builder startTime(LocalTime startTime) {
            this.startTime = startTime;
            return this;
        }

        public Builder endTime(LocalTime endTime) {
            this.endTime = endTime;
            return this;
        }

        public Builder appointmentType(
                String appointmentType
        ) {
            this.appointmentType = appointmentType;
            return this;
        }

        public Builder roomNumber(String roomNumber) {
            this.roomNumber = roomNumber;
            return this;
        }

        public Builder estimatedDurationMinutes(
                int estimatedDurationMinutes
        ) {
            this.estimatedDurationMinutes =
                    estimatedDurationMinutes;

            return this;
        }

        public Builder available(boolean available) {
            this.available = available;
            return this;
        }

        public TimeSlot build() {
            return new TimeSlot(this);
        }
    }
}