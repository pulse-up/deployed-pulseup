package ac.za.cput.pulseup2026.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "students")
public class Student extends User {

    @Column(nullable = false, unique = true)
    private String studentNumber;

    @Column(length = 150)
    private String course;

    @Column(length = 100)
    private String campus;

    @Column(length = 150)
    private String residence;

    @Enumerated(EnumType.STRING)
    @Column(name = "year_of_study", length = 30)
    private YearOfStudy yearOfStudy;

    @Column(length = 100)
    private String emergencyContactName;

    @Column(length = 20)
    private String emergencyContactPhone;

    @Column(nullable = false)
    private int healthPoints;

    protected Student() {
    }

    private Student(Builder builder) {
        super(
                builder.email,
                builder.passwordHash,
                builder.firstName,
                builder.lastName,
                builder.phoneNumber
        );

        this.studentNumber = builder.studentNumber;
        this.course = builder.course;
        this.campus = builder.campus;
        this.residence = builder.residence;
        this.yearOfStudy = builder.yearOfStudy;
        this.emergencyContactName =
                builder.emergencyContactName;
        this.emergencyContactPhone =
                builder.emergencyContactPhone;
        this.healthPoints = 0;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public String getCourse() {
        return course;
    }

    public String getCampus() {
        return campus;
    }

    public String getResidence() {
        return residence;
    }

    public YearOfStudy getYearOfStudy() {
        return yearOfStudy;
    }

    public String getEmergencyContactName() {
        return emergencyContactName;
    }

    public String getEmergencyContactPhone() {
        return emergencyContactPhone;
    }

    public int getHealthPoints() {
        return healthPoints;
    }

    public void addHealthPoints(int points) {
        if (points > 0) {
            this.healthPoints += points;
        }
    }

    public void updateProfile(
            String firstName,
            String lastName,
            String email,
            String phoneNumber,
            String course,
            String campus,
            String residence,
            YearOfStudy yearOfStudy,
            String emergencyContactName,
            String emergencyContactPhone
    ) {
        updatePersonalDetails(
                firstName,
                lastName,
                email,
                phoneNumber
        );

        this.course = course;
        this.campus = campus;
        this.residence = residence;
        this.yearOfStudy = yearOfStudy;
        this.emergencyContactName = emergencyContactName;
        this.emergencyContactPhone = emergencyContactPhone;
    }

    public static class Builder {

        private String email;
        private String passwordHash;
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String studentNumber;
        private String course;
        private String campus;
        private String residence;
        private YearOfStudy yearOfStudy;
        private String emergencyContactName;
        private String emergencyContactPhone;

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

        public Builder studentNumber(String studentNumber) {
            this.studentNumber = studentNumber;
            return this;
        }

        public Builder course(String course) {
            this.course = course;
            return this;
        }

        public Builder campus(String campus) {
            this.campus = campus;
            return this;
        }

        public Builder residence(String residence) {
            this.residence = residence;
            return this;
        }

        public Builder yearOfStudy(
                YearOfStudy yearOfStudy
        ) {
            this.yearOfStudy = yearOfStudy;
            return this;
        }

        public Builder emergencyContactName(
                String emergencyContactName
        ) {
            this.emergencyContactName =
                    emergencyContactName;
            return this;
        }

        public Builder emergencyContactPhone(
                String emergencyContactPhone
        ) {
            this.emergencyContactPhone =
                    emergencyContactPhone;
            return this;
        }

        public Student build() {
            return new Student(this);
        }
    }
}