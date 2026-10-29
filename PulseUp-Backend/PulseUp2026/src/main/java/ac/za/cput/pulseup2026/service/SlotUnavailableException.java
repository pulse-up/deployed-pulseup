package ac.za.cput.pulseup2026.service;

/**
 * Raised when a requested time slot no longer exists or cannot be reserved.
 */
public class SlotUnavailableException extends RuntimeException {

    public SlotUnavailableException() {
        super("The selected time slot is no longer available");
    }
}
