package ac.za.cput.pulseup2026.repository;

import ac.za.cput.pulseup2026.domain.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    Optional<Staff> findByStaffNumber(String staffNumber);

    boolean existsByStaffNumber(String staffNumber);
}