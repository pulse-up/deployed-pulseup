package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.Appointment;
import ac.za.cput.pulseup2026.domain.SickNote;
import ac.za.cput.pulseup2026.domain.SickNoteStatus;
import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.domain.User;
import ac.za.cput.pulseup2026.repository.AppointmentRepository;
import ac.za.cput.pulseup2026.repository.SickNoteRepository;
import ac.za.cput.pulseup2026.repository.StudentRepository;
import ac.za.cput.pulseup2026.repository.UserRepository;
import ac.za.cput.pulseup2026.request.CreateSickNoteRequest;
import ac.za.cput.pulseup2026.request.ReviewSickNoteRequest;
import ac.za.cput.pulseup2026.response.SickNoteResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class SickNoteService {

    private final SickNoteRepository sickNoteRepository;
    private final AppointmentRepository appointmentRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public SickNoteService(
            SickNoteRepository sickNoteRepository,
            AppointmentRepository appointmentRepository,
            StudentRepository studentRepository,
            UserRepository userRepository
    ) {
        this.sickNoteRepository = sickNoteRepository;
        this.appointmentRepository = appointmentRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SickNoteResponse create(
            Long studentId,
            CreateSickNoteRequest request
    ) {
        if (
                studentId == null ||
                        request == null ||
                        request.getAppointmentId() == null ||
                        request.getAbsenceStartDate() == null ||
                        request.getAbsenceEndDate() == null ||
                        request.getAbsenceStartDate().isAfter(
                                request.getAbsenceEndDate()
                        )
        ) {
            return null;
        }

        String reason = clean(request.getRequestReason());
        String referralReason = clean(request.getReferralRequestReason());
        if (
                !hasValidLength(reason, 1, 500) ||
                        (request.isReferralRequested() && (
                                !hasValidLength(referralReason, 10, 500) ||
                                        !request.isReferralConsentConfirmed()
                        ))
        ) {
            return null;
        }

        Student student = studentRepository.findById(studentId).orElse(null);
        Appointment appointment = appointmentRepository
                .findDetailedById(request.getAppointmentId())
                .orElse(null);

        if (
                student == null ||
                        !student.isActive() ||
                        appointment == null ||
                        !studentId.equals(
                                appointment.getStudent().getUserId()
                        ) ||
                        !"COMPLETED".equals(appointment.getStatus()) ||
                        sickNoteRepository.existsByAppointment_AppointmentId(
                                request.getAppointmentId()
                        )
        ) {
            return null;
        }

        SickNote sickNote = SickNote.create(
                student,
                appointment,
                request.getAbsenceStartDate(),
                request.getAbsenceEndDate(),
                reason,
                request.isReferralRequested(),
                referralReason,
                request.isReferralConsentConfirmed()
        );
        if (sickNote == null) {
            return null;
        }

        try {
            return SickNoteResponse.from(
                    sickNoteRepository.saveAndFlush(sickNote)
            );
        } catch (DataIntegrityViolationException exception) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public List<SickNoteResponse> getForStudent(Long studentId) {
        if (studentId == null) {
            return List.of();
        }
        return map(
                sickNoteRepository.findByStudentIdOrderByCreatedAtDesc(
                        studentId
                )
        );
    }

    @Transactional(readOnly = true)
    public List<SickNoteResponse> getForStaff(Long staffId) {
        if (staffId == null) {
            return List.of();
        }
        return map(
                sickNoteRepository.findAssignedToStaffOrderByCreatedAtDesc(
                        staffId
                )
        );
    }

    @Transactional(readOnly = true)
    public List<SickNoteResponse> getAll() {
        return map(
                sickNoteRepository.findAllDetailedOrderByCreatedAtDesc()
        );
    }

    @Transactional(readOnly = true)
    public boolean isAssignedToStaff(
            Long sickNoteId,
            Long staffId
    ) {
        if (sickNoteId == null || staffId == null) {
            return false;
        }
        SickNote sickNote = sickNoteRepository
                .findDetailedById(sickNoteId)
                .orElse(null);
        return sickNote != null && staffId.equals(
                sickNote.getAppointment()
                        .getTimeSlot()
                        .getStaff()
                        .getUserId()
        );
    }

    @Transactional
    public SickNoteResponse review(
            Long sickNoteId,
            Long reviewerId,
            ReviewSickNoteRequest request
    ) {
        if (
                sickNoteId == null ||
                        reviewerId == null ||
                        request == null ||
                        request.getDecision() == null
        ) {
            return null;
        }

        SickNote sickNote = sickNoteRepository
                .findDetailedById(sickNoteId)
                .orElse(null);
        User reviewer = userRepository.findById(reviewerId).orElse(null);
        if (
                sickNote == null ||
                        !(reviewer instanceof Staff staffReviewer) ||
                        !staffReviewer.isActive() ||
                        sickNote.getStatus() != SickNoteStatus.PENDING ||
                        !reviewerId.equals(
                                sickNote.getAppointment()
                                        .getTimeSlot()
                                        .getStaff()
                                        .getUserId()
                        )
        ) {
            return null;
        }

        String comment = clean(request.getReviewerComment());
        if (!hasValidLength(comment, 2, 500)) {
            return null;
        }

        SickNoteStatus decision;
        try {
            decision = SickNoteStatus.valueOf(
                    request.getDecision()
                            .trim()
                            .toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException exception) {
            return null;
        }

        boolean reviewed;
        if (decision == SickNoteStatus.APPROVED) {
            String signature = clean(request.getSignatureText());
            String facilityName = clean(request.getReferralFacilityName());
            String facilityAddress = clean(request.getReferralFacilityAddress());
            String facilityContact = clean(request.getReferralFacilityContact());
            String clinicalSummary = clean(request.getReferralClinicalSummary());
            String instructions = clean(request.getReferralInstructions());

            if (
                    !request.isSignatureConfirmed() ||
                            !hasValidLength(signature, 2, 150) ||
                            !hasMaximumLength(facilityName, 150) ||
                            !hasMaximumLength(facilityAddress, 300) ||
                            !hasMaximumLength(facilityContact, 50) ||
                            !hasMaximumLength(clinicalSummary, 1500) ||
                            !hasMaximumLength(instructions, 1000) ||
                            (sickNote.isReferralRequested() && (
                                    !hasValidLength(facilityName, 2, 150) ||
                                            !hasValidLength(facilityAddress, 5, 300) ||
                                            !hasValidLength(clinicalSummary, 10, 1500)
                            ))
            ) {
                return null;
            }

            reviewed = sickNote.approve(
                    staffReviewer,
                    comment,
                    signature,
                    facilityName,
                    facilityAddress,
                    facilityContact,
                    clinicalSummary,
                    instructions
            );
        } else if (decision == SickNoteStatus.REJECTED) {
            reviewed = sickNote.reject(staffReviewer, comment);
        } else {
            reviewed = false;
        }

        return reviewed
                ? SickNoteResponse.from(
                        sickNoteRepository.saveAndFlush(sickNote)
                )
                : null;
    }

    private List<SickNoteResponse> map(List<SickNote> sickNotes) {
        return sickNotes.stream()
                .map(SickNoteResponse::from)
                .toList();
    }

    private String clean(String value) {
        return value == null || value.trim().isEmpty()
                ? null
                : value.trim();
    }

    private boolean hasValidLength(
            String value,
            int minimum,
            int maximum
    ) {
        return value != null &&
                value.length() >= minimum &&
                value.length() <= maximum;
    }

    private boolean hasMaximumLength(
            String value,
            int maximum
    ) {
        return value == null || value.length() <= maximum;
    }
}
