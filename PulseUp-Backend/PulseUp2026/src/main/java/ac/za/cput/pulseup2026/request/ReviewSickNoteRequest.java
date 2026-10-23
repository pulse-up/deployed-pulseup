package ac.za.cput.pulseup2026.request;

public class ReviewSickNoteRequest {

    private String decision;
    private String reviewerComment;
    private String signatureText;
    private boolean signatureConfirmed;
    private String referralFacilityName;
    private String referralFacilityAddress;
    private String referralFacilityContact;
    private String referralClinicalSummary;
    private String referralInstructions;

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getReviewerComment() {
        return reviewerComment;
    }

    public void setReviewerComment(String reviewerComment) {
        this.reviewerComment = reviewerComment;
    }

    public String getSignatureText() {
        return signatureText;
    }

    public void setSignatureText(String signatureText) {
        this.signatureText = signatureText;
    }

    public boolean isSignatureConfirmed() {
        return signatureConfirmed;
    }

    public void setSignatureConfirmed(boolean signatureConfirmed) {
        this.signatureConfirmed = signatureConfirmed;
    }

    public String getReferralFacilityName() {
        return referralFacilityName;
    }

    public void setReferralFacilityName(String referralFacilityName) {
        this.referralFacilityName = referralFacilityName;
    }

    public String getReferralFacilityAddress() {
        return referralFacilityAddress;
    }

    public void setReferralFacilityAddress(String referralFacilityAddress) {
        this.referralFacilityAddress = referralFacilityAddress;
    }

    public String getReferralFacilityContact() {
        return referralFacilityContact;
    }

    public void setReferralFacilityContact(String referralFacilityContact) {
        this.referralFacilityContact = referralFacilityContact;
    }

    public String getReferralClinicalSummary() {
        return referralClinicalSummary;
    }

    public void setReferralClinicalSummary(String referralClinicalSummary) {
        this.referralClinicalSummary = referralClinicalSummary;
    }

    public String getReferralInstructions() {
        return referralInstructions;
    }

    public void setReferralInstructions(String referralInstructions) {
        this.referralInstructions = referralInstructions;
    }
}
