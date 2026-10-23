package ac.za.cput.pulseup2026.repository;

import ac.za.cput.pulseup2026.domain.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository
        extends JpaRepository<Student, Long> {

    Optional<Student> findByStudentNumber(
            String studentNumber
    );

    Optional<Student> findByEmailIgnoreCase(
            String email
    );

    boolean existsByStudentNumber(
            String studentNumber
    );

    List<Student> findAllByActiveTrue();

    List<Student> findAllByActiveFalse();
}