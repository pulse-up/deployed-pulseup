package ac.za.cput.pulseup2026.util;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public final class ClinicTime {

    public static final ZoneId CAMPUS_ZONE =
            ZoneId.of("Africa/Johannesburg");

    private ClinicTime() {
    }

    public static ZonedDateTime now() {
        return ZonedDateTime.now(CAMPUS_ZONE);
    }

    public static boolean isFutureSlot(
            LocalDate slotDate,
            LocalTime startTime
    ) {
        return isFutureSlot(slotDate, startTime, now());
    }

    public static boolean isFutureSlot(
            LocalDate slotDate,
            LocalTime startTime,
            ZonedDateTime currentDateTime
    ) {
        if (
                slotDate == null ||
                        startTime == null ||
                        currentDateTime == null
        ) {
            return false;
        }

        LocalDate today = currentDateTime.toLocalDate();
        LocalTime currentTime = currentDateTime.toLocalTime();

        return slotDate.isAfter(today) ||
                (
                        slotDate.isEqual(today) &&
                                startTime.isAfter(currentTime)
                );
    }
}
