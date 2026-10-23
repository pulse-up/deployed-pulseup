package ac.za.cput.pulseup2026.factory;

import ac.za.cput.pulseup2026.domain.Admin;

public final class AdminFactory {

    private AdminFactory() {
    }

    public static Admin createAdmin(
            String email,
            String passwordHash,
            String firstName,
            String lastName,
            String phoneNumber,
            String adminNumber,
            String department
    ) {
        if (isNullOrEmpty(email) || isNullOrEmpty(passwordHash)
                || isNullOrEmpty(firstName) || isNullOrEmpty(lastName)
                || isNullOrEmpty(phoneNumber) || isNullOrEmpty(adminNumber)
                || isNullOrEmpty(department)) {
            return null;
        }

        return Admin.builder()
                .email(email)
                .passwordHash(passwordHash)
                .firstName(firstName)
                .lastName(lastName)
                .phoneNumber(phoneNumber)
                .adminNumber(adminNumber)
                .department(department)
                .build();
    }

    private static boolean isNullOrEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
}