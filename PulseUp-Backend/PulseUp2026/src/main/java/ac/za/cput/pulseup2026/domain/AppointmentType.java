package ac.za.cput.pulseup2026.domain;

import java.util.List;
import java.util.Locale;

public enum AppointmentType {

    GENERAL_CONSULTATIONS(
            "General Consultations",
            "General Consultations",
            "Unit A1",
            20,
            List.of(
                    "General Practitioner",
                    "Clinical Nurse"
            )
    ),

    REPRODUCTIVE_HEALTH(
            "Reproductive Health",
            "Reproductive Health",
            "Unit B1",
            30,
            List.of(
                    "Reproductive Health Nurse",
                    "Midwife"
            )
    ),

    HIV_VCT(
            "HIV VCT",
            "HIV VCT",
            "Unit C1",
            30,
            List.of(
                    "HIV Counsellor",
                    "HIV Testing Nurse"
            )
    ),

    TB_DOTS(
            "TB DOTS",
            "TB DOTS",
            "Unit D1",
            15,
            List.of(
                    "TB Nurse",
                    "TB DOTS Support Worker"
            )
    ),

    WOUND_DRESSINGS(
            "Wound Dressings",
            "Wound Dressings",
            "Unit E1",
            30,
            List.of(
                    "Wound Care Nurse",
                    "Clinical Nurse"
            )
    );

    private final String displayName;
    private final String requiredDepartment;
    private final String defaultRoomNumber;
    private final int defaultEstimatedDurationMinutes;
    private final List<String> allowedPositions;

    AppointmentType(
            String displayName,
            String requiredDepartment,
            String defaultRoomNumber,
            int defaultEstimatedDurationMinutes,
            List<String> allowedPositions
    ) {
        this.displayName = displayName;
        this.requiredDepartment = requiredDepartment;
        this.defaultRoomNumber = defaultRoomNumber;
        this.defaultEstimatedDurationMinutes =
                defaultEstimatedDurationMinutes;
        this.allowedPositions = allowedPositions;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getRequiredDepartment() {
        return requiredDepartment;
    }

    public String getDefaultRoomNumber() {
        return defaultRoomNumber;
    }

    public int getDefaultEstimatedDurationMinutes() {
        return defaultEstimatedDurationMinutes;
    }

    public List<String> getAllowedPositions() {
        return allowedPositions;
    }

    public boolean isAllowedForDepartment(
            String department
    ) {
        if (department == null) {
            return false;
        }

        return normalise(requiredDepartment)
                .equals(normalise(department));
    }

    public boolean isPositionAllowed(
            String position
    ) {
        if (position == null || position.isBlank()) {
            return false;
        }

        return allowedPositions.stream()
                .anyMatch(allowedPosition ->
                        normalise(allowedPosition)
                                .equals(normalise(position))
                );
    }

    public static AppointmentType fromValue(
            String value
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        for (AppointmentType appointmentType : values()) {
            if (normalise(appointmentType.displayName)
                    .equals(normalise(value))) {
                return appointmentType;
            }
        }

        return null;
    }

    private static String normalise(String value) {
        return value
                .trim()
                .toLowerCase(Locale.ROOT);
    }
}