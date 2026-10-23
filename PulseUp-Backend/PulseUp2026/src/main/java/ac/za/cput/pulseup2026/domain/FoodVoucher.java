package ac.za.cput.pulseup2026.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "food_vouchers",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_food_voucher_student_tier",
                        columnNames = {
                                "student_id",
                                "points_threshold"
                        }
                ),
                @UniqueConstraint(
                        name = "uk_food_voucher_code",
                        columnNames = "voucher_code"
                )
        }
)
public class FoodVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long voucherId;

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "student_id",
            nullable = false
    )
    private Student student;

    @Column(
            name = "voucher_code",
            nullable = false,
            unique = true,
            length = 60
    )
    private String voucherCode;

    @Column(nullable = false)
    private int amount;

    @Column(
            name = "points_threshold",
            nullable = false
    )
    private int pointsThreshold;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 20
    )
    private VoucherStatus status;

    @Column(nullable = false)
    private LocalDateTime issuedAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime redeemedAt;

    protected FoodVoucher() {
    }

    private FoodVoucher(Builder builder) {
        this.student = builder.student;
        this.voucherCode = builder.voucherCode;
        this.amount = builder.amount;
        this.pointsThreshold = builder.pointsThreshold;
        this.status = VoucherStatus.ACTIVE;
        this.issuedAt = builder.issuedAt;
        this.expiresAt = builder.expiresAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getVoucherId() {
        return voucherId;
    }

    public Student getStudent() {
        return student;
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

    public boolean expireIfNecessary(
            LocalDateTime currentTime
    ) {
        if (
                status == VoucherStatus.ACTIVE &&
                        expiresAt != null &&
                        currentTime != null &&
                        currentTime.isAfter(expiresAt)
        ) {
            status = VoucherStatus.EXPIRED;
            return true;
        }

        return false;
    }

    public boolean redeem() {
        if (status != VoucherStatus.ACTIVE) {
            return false;
        }

        if (
                expiresAt != null &&
                        LocalDateTime.now().isAfter(expiresAt)
        ) {
            status = VoucherStatus.EXPIRED;
            return false;
        }

        status = VoucherStatus.REDEEMED;
        redeemedAt = LocalDateTime.now();

        return true;
    }

    public static class Builder {

        private Student student;
        private String voucherCode;
        private int amount;
        private int pointsThreshold;
        private LocalDateTime issuedAt;
        private LocalDateTime expiresAt;

        public Builder student(Student student) {
            this.student = student;
            return this;
        }

        public Builder voucherCode(
                String voucherCode
        ) {
            this.voucherCode = voucherCode;
            return this;
        }

        public Builder amount(int amount) {
            this.amount = amount;
            return this;
        }

        public Builder pointsThreshold(
                int pointsThreshold
        ) {
            this.pointsThreshold = pointsThreshold;
            return this;
        }

        public Builder issuedAt(
                LocalDateTime issuedAt
        ) {
            this.issuedAt = issuedAt;
            return this;
        }

        public Builder expiresAt(
                LocalDateTime expiresAt
        ) {
            this.expiresAt = expiresAt;
            return this;
        }

        public FoodVoucher build() {
            return new FoodVoucher(this);
        }
    }
}