package ac.za.cput.pulseup2026.factory;

import ac.za.cput.pulseup2026.domain.Staff;

public final class StaffFactory {

    private StaffFactory() {
    }

    public static Staff createStaff(
            String email,
            String passwordHash,
            String firstName,
            String lastName,
            String phoneNumber,
            String staffNumber,
            String department,
            String position,
            String specialization
    ) {
        if (isBlank(email)
                || isBlank(passwordHash)
                || isBlank(firstName)
                || isBlank(lastName)
                || isBlank(phoneNumber)
                || isBlank(staffNumber)
                || isBlank(department)
                || isBlank(position)
                || isBlank(specialization)) {
            return null;
        }

        return Staff.builder()
                .email(email)
                .passwordHash(passwordHash)
                .firstName(firstName)
                .lastName(lastName)
                .phoneNumber(phoneNumber)
                .staffNumber(staffNumber)
                .department(department)
                .position(position)
                .specialization(specialization)
                .build();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}