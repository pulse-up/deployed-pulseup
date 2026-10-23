package ac.za.cput.pulseup2026.factory;

import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.domain.YearOfStudy;

public final class StudentFactory {

    private StudentFactory() {
    }

    public static Student createStudent(
            String email,
            String passwordHash,
            String firstName,
            String lastName,
            String phoneNumber,
            String studentNumber,
            String course,
            String campus,
            String residence,
            YearOfStudy yearOfStudy,
            String emergencyContactName,
            String emergencyContactPhone
    ) {
        if (isBlank(email) || isBlank(passwordHash) || isBlank(firstName) ||
                isBlank(lastName) || isBlank(phoneNumber) ||
                isBlank(studentNumber) || isBlank(course) || isBlank(campus) ||
                isBlank(residence) || yearOfStudy == null ||
                isBlank(emergencyContactName) || isBlank(emergencyContactPhone)) {
            return null;
        }

        return Student.builder()
                .email(email.trim().toLowerCase())
                .passwordHash(passwordHash)
                .firstName(firstName.trim())
                .lastName(lastName.trim())
                .phoneNumber(phoneNumber.trim())
                .studentNumber(studentNumber.trim())
                .course(trimToNull(course))
                .campus(campus.trim())
                .residence(trimToNull(residence))
                .yearOfStudy(yearOfStudy)
                .emergencyContactName(trimToNull(emergencyContactName))
                .emergencyContactPhone(trimToNull(emergencyContactPhone))
                .build();
    }

    private static String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
