package ac.za.cput.pulseup2026.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum YearOfStudy {

    FIRST_YEAR("1st Year"),
    SECOND_YEAR("2nd Year"),
    THIRD_YEAR("3rd Year"),
    FOURTH_YEAR("4th Year"),
    POSTGRADUATE("Postgraduate"),
    MASTERS("Masters"),
    PHD("PhD");

    private final String displayName;

    YearOfStudy(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    @JsonValue
    public String toJson() {
        return name();
    }

    @JsonCreator
    public static YearOfStudy fromValue(
            String value
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalisedValue =
                normalise(value);

        for (YearOfStudy year : values()) {
            boolean matchesEnumName =
                    normalise(year.name())
                            .equals(normalisedValue);

            boolean matchesDisplayName =
                    normalise(year.displayName)
                            .equals(normalisedValue);

            if (matchesEnumName
                    || matchesDisplayName) {
                return year;
            }
        }

        throw new IllegalArgumentException(
                "Unsupported year of study: "
                        + value
        );
    }

    private static String normalise(
            String value
    ) {
        return value
                .trim()
                .replace("-", "")
                .replace("_", "")
                .replace(" ", "")
                .toLowerCase(Locale.ROOT);
    }
}