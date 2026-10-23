package ac.za.cput.pulseup2026.request;

import java.time.LocalDate;

public class CreateSickNoteRequest {

    private Long appointmentId;
    private LocalDate absenceStartDate;
    private LocalDate absenceEndDate;
    private String requestReason;
    private boolean referralRequested;
    private String referralRequestReason;
    private boolean referralConsentConfirmed;

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public LocalDate getAbsenceStartDate() {
        return absenceStartDate;
    }

    public void setAbsenceStartDate(LocalDate absenceStartDate) {
        this.absenceStartDate = absenceStartDate;
    }

    public LocalDate getAbsenceEndDate() {
        return absenceEndDate;
    }

    public void setAbsenceEndDate(LocalDate absenceEndDate) {
        this.absenceEndDate = absenceEndDate;
    }

    public String getRequestReason() {
        return requestReason;
    }

    public void setRequestReason(String requestReason) {
        this.requestReason = requestReason;
    }

    public boolean isReferralRequested() {
        return referralRequested;
    }

    public void setReferralRequested(boolean referralRequested) {
        this.referralRequested = referralRequested;
    }

    public String getReferralRequestReason() {
        return referralRequestReason;
    }

    public void setReferralRequestReason(String referralRequestReason) {
        this.referralRequestReason = referralRequestReason;
    }

    public boolean isReferralConsentConfirmed() {
        return referralConsentConfirmed;
    }

    public void setReferralConsentConfirmed(boolean referralConsentConfirmed) {
        this.referralConsentConfirmed = referralConsentConfirmed;
    }
}
