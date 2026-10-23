package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.FoodVoucher;
import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.domain.VoucherStatus;
import ac.za.cput.pulseup2026.repository.FoodVoucherRepository;
import ac.za.cput.pulseup2026.repository.StudentRepository;
import ac.za.cput.pulseup2026.response.FoodVoucherResponse;
import ac.za.cput.pulseup2026.response.VoucherProgressResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class FoodVoucherService {

    public static final int POINTS_PER_COMPLETED_VISIT =
            10;

    private static final int VOUCHER_VALIDITY_DAYS =
            30;

    private static final List<Integer> VOUCHER_TIERS =
            List.of(
                    60,
                    80,
                    100,
                    120
            );

    private final FoodVoucherRepository
            foodVoucherRepository;

    private final StudentRepository studentRepository;

    public FoodVoucherService(
            FoodVoucherRepository foodVoucherRepository,
            StudentRepository studentRepository
    ) {
        this.foodVoucherRepository =
                foodVoucherRepository;

        this.studentRepository =
                studentRepository;
    }

    /*
     * Creates any vouchers that the student qualifies
     * for but has not already received.
     */
    public List<FoodVoucher> issueEligibleVouchers(
            Student student
    ) {
        if (
                student == null ||
                        student.getUserId() == null
        ) {
            return List.of();
        }

        List<FoodVoucher> issuedVouchers =
                new ArrayList<>();

        for (Integer tier : VOUCHER_TIERS) {
            if (student.getHealthPoints() < tier) {
                continue;
            }

            boolean alreadyIssued =
                    foodVoucherRepository
                            .existsByStudentUserIdAndPointsThreshold(
                                    student.getUserId(),
                                    tier
                            );

            if (alreadyIssued) {
                continue;
            }

            LocalDateTime issuedAt =
                    LocalDateTime.now();

            FoodVoucher voucher =
                    FoodVoucher.builder()
                            .student(student)
                            .voucherCode(
                                    generateVoucherCode(
                                            student,
                                            tier
                                    )
                            )
                            .amount(tier)
                            .pointsThreshold(tier)
                            .issuedAt(issuedAt)
                            .expiresAt(
                                    issuedAt.plusDays(
                                            VOUCHER_VALIDITY_DAYS
                                    )
                            )
                            .build();

            issuedVouchers.add(
                    foodVoucherRepository.save(voucher)
            );
        }

        return issuedVouchers;
    }

    public VoucherProgressResponse getProgress(
            Long studentId
    ) {
        if (studentId == null) {
            return null;
        }

        Student student =
                studentRepository
                        .findById(studentId)
                        .orElse(null);

        if (
                student == null ||
                        !student.isActive()
        ) {
            return null;
        }

        /*
         * This also creates vouchers for students who
         * already had points before this feature was added.
         */
        issueEligibleVouchers(student);

        List<FoodVoucher> vouchers =
                foodVoucherRepository
                        .findByStudentUserIdOrderByPointsThresholdDesc(
                                studentId
                        );

        refreshExpiredStatuses(vouchers);

        List<FoodVoucherResponse> voucherResponses =
                vouchers.stream()
                        .map(FoodVoucherResponse::from)
                        .toList();

        FoodVoucherResponse activeVoucher =
                vouchers.stream()
                        .filter(voucher ->
                                voucher.getStatus()
                                        == VoucherStatus.ACTIVE
                        )
                        .findFirst()
                        .map(FoodVoucherResponse::from)
                        .orElse(null);

        int healthPoints =
                student.getHealthPoints();

        int currentTier =
                findCurrentTier(healthPoints);

        Integer nextTier =
                findNextTier(healthPoints);

        int pointsToNextTier =
                nextTier == null
                        ? 0
                        : Math.max(
                        0,
                        nextTier - healthPoints
                );

        int visitsToNextTier =
                pointsToNextTier == 0
                        ? 0
                        : (int) Math.ceil(
                        pointsToNextTier /
                                (double)
                                        POINTS_PER_COMPLETED_VISIT
                );

        int progressPercentage =
                nextTier == null
                        ? 100
                        : Math.min(
                        100,
                        (int) Math.round(
                                healthPoints * 100.0
                                        / nextTier
                        )
                );

        boolean questActive =
                nextTier != null;

        String progressMessage =
                buildProgressMessage(
                        nextTier,
                        visitsToNextTier
                );

        return new VoucherProgressResponse(
                healthPoints,
                POINTS_PER_COMPLETED_VISIT,
                currentTier,
                nextTier,
                VOUCHER_TIERS.get(
                        VOUCHER_TIERS.size() - 1
                ),
                progressPercentage,
                pointsToNextTier,
                visitsToNextTier,
                questActive,
                progressMessage,
                activeVoucher,
                voucherResponses,
                VOUCHER_TIERS
        );
    }

    public List<FoodVoucherResponse>
    getVouchersForStudent(Long studentId) {
        if (studentId == null) {
            return List.of();
        }

        Student student =
                studentRepository
                        .findById(studentId)
                        .orElse(null);

        if (student == null) {
            return List.of();
        }

        issueEligibleVouchers(student);

        List<FoodVoucher> vouchers =
                foodVoucherRepository
                        .findByStudentUserIdOrderByPointsThresholdDesc(
                                studentId
                        );

        refreshExpiredStatuses(vouchers);

        return vouchers.stream()
                .map(FoodVoucherResponse::from)
                .toList();
    }

    private void refreshExpiredStatuses(
            List<FoodVoucher> vouchers
    ) {
        if (
                vouchers == null ||
                        vouchers.isEmpty()
        ) {
            return;
        }

        LocalDateTime currentTime =
                LocalDateTime.now();

        boolean changed = false;

        for (FoodVoucher voucher : vouchers) {
            if (
                    voucher.expireIfNecessary(
                            currentTime
                    )
            ) {
                changed = true;
            }
        }

        if (changed) {
            foodVoucherRepository.saveAll(vouchers);
        }
    }

    private int findCurrentTier(
            int healthPoints
    ) {
        int currentTier = 0;

        for (Integer tier : VOUCHER_TIERS) {
            if (healthPoints >= tier) {
                currentTier = tier;
            }
        }

        return currentTier;
    }

    private Integer findNextTier(
            int healthPoints
    ) {
        for (Integer tier : VOUCHER_TIERS) {
            if (healthPoints < tier) {
                return tier;
            }
        }

        return null;
    }

    private String buildProgressMessage(
            Integer nextTier,
            int visitsToNextTier
    ) {
        if (nextTier == null) {
            return "You have unlocked the highest Cyngatha food voucher tier.";
        }

        String visitWord =
                visitsToNextTier == 1
                        ? "visit"
                        : "visits";

        return "Complete "
                + visitsToNextTier
                + " more clinic wellness "
                + visitWord
                + " to unlock your R"
                + nextTier
                + " Cyngatha food voucher.";
    }

    private String generateVoucherCode(
            Student student,
            int amount
    ) {
        String studentPart =
                String.valueOf(
                                student.getStudentNumber()
                        )
                        .replaceAll(
                                "[^A-Za-z0-9]",
                                ""
                        )
                        .toUpperCase(Locale.ROOT);

        if (studentPart.length() > 4) {
            studentPart =
                    studentPart.substring(
                            studentPart.length() - 4
                    );
        }

        for (int attempt = 0; attempt < 5; attempt++) {
            String randomPart =
                    UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .substring(0, 8)
                            .toUpperCase(Locale.ROOT);

            String voucherCode =
                    "CYNG-"
                            + studentPart
                            + "-"
                            + amount
                            + "-"
                            + randomPart;

            if (
                    !foodVoucherRepository
                            .existsByVoucherCode(
                                    voucherCode
                            )
            ) {
                return voucherCode;
            }
        }

        throw new IllegalStateException(
                "Could not generate a unique voucher code"
        );
    }
}