package ac.za.cput.pulseup2026.util;

import java.util.Locale;
import java.util.regex.Pattern;

public final class StudentIdentityValidator {

    private static final Pattern STUDENT_NUMBER_PATTERN =
            Pattern.compile("^2[0-9]{8}$");

    private static final Pattern STUDENT_EMAIL_PATTERN =
            Pattern.compile("^2[0-9]{8}@mycput\\.ac\\.za$");

    private StudentIdentityValidator() {
    }

    public static boolean isValidStudentNumber(
            String studentNumber
    ) {
        return studentNumber != null &&
                STUDENT_NUMBER_PATTERN.matcher(
                        studentNumber.trim()
                ).matches();
    }

    public static boolean isValidStudentEmail(
            String email
    ) {
        return email != null &&
                STUDENT_EMAIL_PATTERN.matcher(
                        normaliseEmail(email)
                ).matches();
    }

    public static boolean isMatchingIdentity(
            String email,
            String studentNumber
    ) {
        if (
                !isValidStudentEmail(email) ||
                        !isValidStudentNumber(studentNumber)
        ) {
            return false;
        }

        return normaliseEmail(email).equals(
                studentNumber.trim() + "@mycput.ac.za"
        );
    }

    public static String normaliseEmail(String email) {
        return email == null
                ? ""
                : email.trim().toLowerCase(Locale.ROOT);
    }
}
