package ac.za.cput.pulseup2026.repository;

import ac.za.cput.pulseup2026.domain.HealthPointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthPointTransactionRepository
        extends JpaRepository<
        HealthPointTransaction,
        Long
        > {

    boolean existsByStudentUserId(Long studentId);

    boolean existsByAppointmentAppointmentId(
            Long appointmentId
    );

    List<HealthPointTransaction>
    findByStudentUserIdOrderByAwardedAtDesc(
            Long studentId
    );
}