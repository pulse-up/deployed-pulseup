package ac.za.cput.pulseup2026.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "admins")
public class Admin extends User {

    @Column(nullable = false, unique = true)
    private String adminNumber;

    private String department;

    protected Admin() {
    }

    private Admin(Builder builder) {
        super(
                builder.email,
                builder.passwordHash,
                builder.firstName,
                builder.lastName,
                builder.phoneNumber
        );

        this.adminNumber = builder.adminNumber;
        this.department = builder.department;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getAdminNumber() {
        return adminNumber;
    }

    public String getDepartment() {
        return department;
    }

    public static class Builder {

        private String email;
        private String passwordHash;
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String adminNumber;
        private String department;

        public Builder email(String email) {this.email = email;return this;}

        public Builder passwordHash(String passwordHash) {this.passwordHash = passwordHash;return this;}

        public Builder firstName(String firstName) {this.firstName = firstName;return this;}

        public Builder lastName(String lastName) {this.lastName = lastName;return this;}

        public Builder phoneNumber(String phoneNumber) {this.phoneNumber = phoneNumber;return this;}

        public Builder adminNumber(String adminNumber) {this.adminNumber = adminNumber;return this;}

        public Builder department(String department) {this.department = department;return this;}

        public Admin build() {
            return new Admin(this);
        }
    }
}