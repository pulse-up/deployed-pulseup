package ac.za.cput.pulseup2026.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sick_notes")
public class SickNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sickNoteId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(nullable = false)
    private LocalDate absenceStartDate;

    @Column(nullable = false)
    private LocalDate absenceEndDate;

    @Column(nullable = false, length = 500)
    private String requestReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SickNoteStatus status = SickNoteStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime reviewedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_user_id")
    private User reviewedBy;

    @Column(length = 500)
    private String reviewerComment;

    private Boolean referralRequested;

    @Column(length = 500)
    private String referralRequestReason;

    private Boolean referralConsentConfirmed;

    @Column(length = 150)
    private String referralFacilityName;

    @Column(length = 300)
    private String referralFacilityAddress;

    @Column(length = 50)
    private String referralFacilityContact;

    @Column(length = 1500)
    private String referralClinicalSummary;

    @Column(length = 1000)
    private String referralInstructions;

    @Column(length = 150)
    private String signatureText;

    private LocalDateTime signedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signed_by_staff_id")
    private Staff signedByStaff;

    @Version
    private Long version;

    protected SickNote() {
    }

    private SickNote(
            Student student,
            Appointment appointment,
            LocalDate absenceStartDate,
            LocalDate absenceEndDate,
            String requestReason,
            boolean referralRequested,
            String referralRequestReason,
            boolean referralConsentConfirmed
    ) {
        this.student = student;
        this.appointment = appointment;
        this.absenceStartDate = absenceStartDate;
        this.absenceEndDate = absenceEndDate;
        this.requestReason = requestReason;
        this.referralRequested = referralRequested;
        this.referralRequestReason = referralRequested
                ? referralRequestReason
                : null;
        this.referralConsentConfirmed = referralRequested
                ? referralConsentConfirmed
                : false;
        this.status = SickNoteStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public static SickNote create(
            Student student,
            Appointment appointment,
            LocalDate absenceStartDate,
            LocalDate absenceEndDate,
            String requestReason,
            boolean referralRequested,
            String referralRequestReason,
            boolean referralConsentConfirmed
    ) {
        if (
                student == null ||
                        appointment == null ||
                        absenceStartDate == null ||
                        absenceEndDate == null ||
                        requestReason == null ||
                        requestReason.isBlank() ||
                        (referralRequested && (
                                referralRequestReason == null ||
                                        referralRequestReason.isBlank() ||
                                        !referralConsentConfirmed
                        ))
        ) {
            return null;
        }

        return new SickNote(
                student,
                appointment,
                absenceStartDate,
                absenceEndDate,
                requestReason.trim(),
                referralRequested,
                referralRequestReason == null
                        ? null
                        : referralRequestReason.trim(),
                referralConsentConfirmed
        );
    }

    public boolean approve(
            Staff reviewer,
            String comment,
            String signature,
            String facilityName,
            String facilityAddress,
            String facilityContact,
            String clinicalSummary,
            String instructions
    ) {
        if (
                status != SickNoteStatus.PENDING ||
                        reviewer == null ||
                        isBlank(signature) ||
                        (isReferralRequested() && (
                                isBlank(facilityName) ||
                                        isBlank(facilityAddress) ||
                                        isBlank(clinicalSummary)
                        ))
        ) {
            return false;
        }

        signatureText = signature.trim();
        signedByStaff = reviewer;
        signedAt = LocalDateTime.now();
        referralFacilityName = clean(facilityName);
        referralFacilityAddress = clean(facilityAddress);
        referralFacilityContact = clean(facilityContact);
        referralClinicalSummary = clean(clinicalSummary);
        referralInstructions = clean(instructions);
        return review(SickNoteStatus.APPROVED, reviewer, comment);
    }

    public boolean reject(Staff reviewer, String comment) {
        if (isBlank(comment)) {
            return false;
        }
        return review(SickNoteStatus.REJECTED, reviewer, comment);
    }

    private boolean review(
            SickNoteStatus decision,
            User reviewer,
            String comment
    ) {
        if (
                status != SickNoteStatus.PENDING ||
                        reviewer == null ||
                        decision == null
        ) {
            return false;
        }
        status = decision;
        reviewedBy = reviewer;
        reviewerComment = clean(comment);
        reviewedAt = LocalDateTime.now();
        return true;
    }

    private static String clean(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    public Long getSickNoteId() { return sickNoteId; }
    public Student getStudent() { return student; }
    public Appointment getAppointment() { return appointment; }
    public LocalDate getAbsenceStartDate() { return absenceStartDate; }
    public LocalDate getAbsenceEndDate() { return absenceEndDate; }
    public String getRequestReason() { return requestReason; }
    public SickNoteStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public User getReviewedBy() { return reviewedBy; }
    public String getReviewerComment() { return reviewerComment; }
    public boolean isReferralRequested() { return Boolean.TRUE.equals(referralRequested); }
    public String getReferralRequestReason() { return referralRequestReason; }
    public boolean isReferralConsentConfirmed() { return Boolean.TRUE.equals(referralConsentConfirmed); }
    public String getReferralFacilityName() { return referralFacilityName; }
    public String getReferralFacilityAddress() { return referralFacilityAddress; }
    public String getReferralFacilityContact() { return referralFacilityContact; }
    public String getReferralClinicalSummary() { return referralClinicalSummary; }
    public String getReferralInstructions() { return referralInstructions; }
    public String getSignatureText() { return signatureText; }
    public LocalDateTime getSignedAt() { return signedAt; }
    public Staff getSignedByStaff() { return signedByStaff; }
    public boolean isLetterAvailable() {
        return status == SickNoteStatus.APPROVED && signedAt != null && !isBlank(signatureText);
    }
    public Long getVersion() { return version; }
}
