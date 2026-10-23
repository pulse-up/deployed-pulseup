package ac.za.cput.pulseup2026.repository;

import ac.za.cput.pulseup2026.domain.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {

    Optional<Admin> findByAdminNumber(String adminNumber);

    boolean existsByAdminNumber(String adminNumber);
}