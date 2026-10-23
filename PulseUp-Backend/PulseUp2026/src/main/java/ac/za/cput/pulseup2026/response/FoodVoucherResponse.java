package ac.za.cput.pulseup2026.response;

import ac.za.cput.pulseup2026.domain.FoodVoucher;
import ac.za.cput.pulseup2026.domain.VoucherStatus;

import java.time.LocalDateTime;

public class FoodVoucherResponse {

    private final Long voucherId;
    private final String voucherCode;
    private final int amount;
    private final int pointsThreshold;
    private final VoucherStatus status;
    private final LocalDateTime issuedAt;
    private final LocalDateTime expiresAt;
    private final LocalDateTime redeemedAt;

    public FoodVoucherResponse(
            Long voucherId,
            String voucherCode,
            int amount,
            int pointsThreshold,
            VoucherStatus status,
            LocalDateTime issuedAt,
            LocalDateTime expiresAt,
            LocalDateTime redeemedAt
    ) {
        this.voucherId = voucherId;
        this.voucherCode = voucherCode;
        this.amount = amount;
        this.pointsThreshold = pointsThreshold;
        this.status = status;
        this.issuedAt = issuedAt;
        this.expiresAt = expiresAt;
        this.redeemedAt = redeemedAt;
    }

    public static FoodVoucherResponse from(
            FoodVoucher voucher
    ) {
        if (voucher == null) {
            return null;
        }

        return new FoodVoucherResponse(
                voucher.getVoucherId(),
                voucher.getVoucherCode(),
                voucher.getAmount(),
                voucher.getPointsThreshold(),
                voucher.getStatus(),
                voucher.getIssuedAt(),
                voucher.getExpiresAt(),
                voucher.getRedeemedAt()
        );
    }

    public Long getVoucherId() {
        return voucherId;
    }

    public String getVoucherCode() {
        return voucherCode;
    }

    public int getAmount() {
        return amount;
    }

    public int getPointsThreshold() {
        return pointsThreshold;
    }

    public VoucherStatus getStatus() {
        return status;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public LocalDateTime getRedeemedAt() {
        return redeemedAt;
    }
}