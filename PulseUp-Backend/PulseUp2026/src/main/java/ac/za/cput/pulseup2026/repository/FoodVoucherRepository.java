package ac.za.cput.pulseup2026.repository;

import ac.za.cput.pulseup2026.domain.FoodVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodVoucherRepository
        extends JpaRepository<FoodVoucher, Long> {

    boolean existsByStudentUserIdAndPointsThreshold(
            Long studentId,
            int pointsThreshold
    );

    boolean existsByVoucherCode(
            String voucherCode
    );

    List<FoodVoucher>
    findByStudentUserIdOrderByPointsThresholdDesc(
            Long studentId
    );

    Optional<FoodVoucher> findByVoucherCode(
            String voucherCode
    );
}