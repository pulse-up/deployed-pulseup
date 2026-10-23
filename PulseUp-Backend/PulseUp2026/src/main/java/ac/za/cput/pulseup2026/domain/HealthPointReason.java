package ac.za.cput.pulseup2026.domain;

public enum HealthPointReason {

    COMPLETED_APPOINTMENT(
            "Completed clinic appointment"
    );

    private final String displayName;

    HealthPointReason(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}