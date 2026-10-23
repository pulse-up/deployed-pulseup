package ac.za.cput.pulseup2026.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "staff")
public class Staff extends User {

    @Column(nullable = false, unique = true)
    private String staffNumber;

    private String department;

    private String position;

    private String specialization;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StaffAvailabilityStatus availabilityStatus =
            StaffAvailabilityStatus.AVAILABLE;

    protected Staff() {
    }

    private Staff(Builder builder) {
        super(
                builder.email,
                builder.passwordHash,
                builder.firstName,
                builder.lastName,
                builder.phoneNumber
        );

        this.staffNumber = builder.staffNumber;
        this.department = builder.department;
        this.position = builder.position;
        this.specialization = builder.specialization;
        this.availabilityStatus = StaffAvailabilityStatus.AVAILABLE;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getStaffNumber() {
        return staffNumber;
    }

    public String getDepartment() {
        return department;
    }

    public String getPosition() {
        return position;
    }

    public String getSpecialization() {
        return specialization;
    }

    public StaffAvailabilityStatus getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(
            StaffAvailabilityStatus availabilityStatus
    ) {
        if (availabilityStatus != null) {
            this.availabilityStatus = availabilityStatus;
        }
    }

    public static class Builder {

        private String email;
        private String passwordHash;
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String staffNumber;
        private String department;
        private String position;
        private String specialization;

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder passwordHash(String passwordHash) {
            this.passwordHash = passwordHash;
            return this;
        }

        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public Builder phoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        public Builder staffNumber(String staffNumber) {
            this.staffNumber = staffNumber;
            return this;
        }

        public Builder department(String department) {
            this.department = department;
            return this;
        }

        public Builder position(String position) {
            this.position = position;
            return this;
        }

        public Builder specialization(String specialization) {
            this.specialization = specialization;
            return this;
        }

        public Staff build() {
            return new Staff(this);
        }
    }
}