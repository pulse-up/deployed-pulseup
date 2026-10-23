package ac.za.cput.pulseup2026.response;

import ac.za.cput.pulseup2026.domain.Appointment;
import ac.za.cput.pulseup2026.domain.SickNote;
import ac.za.cput.pulseup2026.domain.SickNoteStatus;
import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.domain.User;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SickNoteResponse(
        Long sickNoteId,
        Long appointmentId,
        String appointmentType,
        LocalDate appointmentDate,
        Long studentId,
        String studentNumber,
        String studentName,
        LocalDate absenceStartDate,
        LocalDate absenceEndDate,
        String requestReason,
        SickNoteStatus status,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt,
        String reviewerName,
        String reviewerComment,
        boolean referralRequested,
        String referralRequestReason,
        boolean referralConsentConfirmed,
        String referralFacilityName,
        String referralFacilityAddress,
        String referralFacilityContact,
        String referralClinicalSummary,
        String referralInstructions,
        String signatureText,
        LocalDateTime signedAt,
        String signerName,
        String signerPosition,
        String signerStaffNumber,
        boolean letterAvailable
) {
    public static SickNoteResponse from(SickNote sickNote) {
        Appointment appointment = sickNote.getAppointment();
        Student student = sickNote.getStudent();
        User reviewer = sickNote.getReviewedBy();
        Staff signer = sickNote.getSignedByStaff();

        return new SickNoteResponse(
                sickNote.getSickNoteId(),
                appointment.getAppointmentId(),
                appointment.getAppointmentType(),
                appointment.getTimeSlot().getSlotDate(),
                student.getUserId(),
                student.getStudentNumber(),
                fullName(student),
                sickNote.getAbsenceStartDate(),
                sickNote.getAbsenceEndDate(),
                sickNote.getRequestReason(),
                sickNote.getStatus(),
                sickNote.getCreatedAt(),
                sickNote.getReviewedAt(),
                reviewer == null ? null : fullName(reviewer),
                sickNote.getReviewerComment(),
                sickNote.isReferralRequested(),
                sickNote.getReferralRequestReason(),
                sickNote.isReferralConsentConfirmed(),
                sickNote.getReferralFacilityName(),
                sickNote.getReferralFacilityAddress(),
                sickNote.getReferralFacilityContact(),
                sickNote.getReferralClinicalSummary(),
                sickNote.getReferralInstructions(),
                sickNote.getSignatureText(),
                sickNote.getSignedAt(),
                signer == null ? null : fullName(signer),
                signer == null ? null : signer.getPosition(),
                signer == null ? null : signer.getStaffNumber(),
                sickNote.isLetterAvailable()
        );
    }

    private static String fullName(User user) {
        return (user.getFirstName() + " " + user.getLastName()).trim();
    }
}
