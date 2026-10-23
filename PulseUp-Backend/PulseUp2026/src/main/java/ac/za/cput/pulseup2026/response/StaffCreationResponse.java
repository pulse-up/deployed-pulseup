package ac.za.cput.pulseup2026.response;

import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.domain.StaffAvailabilityStatus;

public record StaffCreationResponse(
        Long userId,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        String staffNumber,
        String department,
        String position,
        String specialization,
        StaffAvailabilityStatus availabilityStatus
) {
    public static StaffCreationResponse from(Staff staff) {
        if (staff == null) {
            return null;
        }

        return new StaffCreationResponse(
                staff.getUserId(),
                staff.getFirstName(),
                staff.getLastName(),
                staff.getEmail(),
                staff.getPhoneNumber(),
                staff.getStaffNumber(),
                staff.getDepartment(),
                staff.getPosition(),
                staff.getSpecialization(),
                staff.getAvailabilityStatus()
        );
    }
}
