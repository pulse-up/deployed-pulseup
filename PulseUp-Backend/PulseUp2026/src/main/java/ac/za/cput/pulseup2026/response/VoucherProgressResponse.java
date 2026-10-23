package ac.za.cput.pulseup2026.response;

import java.util.List;

public class VoucherProgressResponse {

    private final int healthPoints;
    private final int pointsPerCompletedVisit;
    private final int currentTierAmount;
    private final Integer nextTierAmount;
    private final int maximumTierAmount;
    private final int progressPercentage;
    private final int pointsToNextTier;
    private final int visitsToNextTier;
    private final boolean questActive;
    private final String progressMessage;
    private final FoodVoucherResponse activeVoucher;
    private final List<FoodVoucherResponse> vouchers;
    private final List<Integer> voucherTiers;

    public VoucherProgressResponse(
            int healthPoints,
            int pointsPerCompletedVisit,
            int currentTierAmount,
            Integer nextTierAmount,
            int maximumTierAmount,
            int progressPercentage,
            int pointsToNextTier,
            int visitsToNextTier,
            boolean questActive,
            String progressMessage,
            FoodVoucherResponse activeVoucher,
            List<FoodVoucherResponse> vouchers,
            List<Integer> voucherTiers
    ) {
        this.healthPoints = healthPoints;
        this.pointsPerCompletedVisit =
                pointsPerCompletedVisit;
        this.currentTierAmount =
                currentTierAmount;
        this.nextTierAmount = nextTierAmount;
        this.maximumTierAmount =
                maximumTierAmount;
        this.progressPercentage =
                progressPercentage;
        this.pointsToNextTier =
                pointsToNextTier;
        this.visitsToNextTier =
                visitsToNextTier;
        this.questActive = questActive;
        this.progressMessage =
                progressMessage;
        this.activeVoucher = activeVoucher;
        this.vouchers = vouchers;
        this.voucherTiers = voucherTiers;
    }

    public int getHealthPoints() {
        return healthPoints;
    }

    public int getPointsPerCompletedVisit() {
        return pointsPerCompletedVisit;
    }

    public int getCurrentTierAmount() {
        return currentTierAmount;
    }

    public Integer getNextTierAmount() {
        return nextTierAmount;
    }

    public int getMaximumTierAmount() {
        return maximumTierAmount;
    }

    public int getProgressPercentage() {
        return progressPercentage;
    }

    public int getPointsToNextTier() {
        return pointsToNextTier;
    }

    public int getVisitsToNextTier() {
        return visitsToNextTier;
    }

    public boolean isQuestActive() {
        return questActive;
    }

    public String getProgressMessage() {
        return progressMessage;
    }

    public FoodVoucherResponse getActiveVoucher() {
        return activeVoucher;
    }

    public List<FoodVoucherResponse> getVouchers() {
        return vouchers;
    }

    public List<Integer> getVoucherTiers() {
        return voucherTiers;
    }
}