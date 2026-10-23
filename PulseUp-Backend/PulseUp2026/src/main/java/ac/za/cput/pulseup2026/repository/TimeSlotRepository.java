package ac.za.cput.pulseup2026.repository;

import ac.za.cput.pulseup2026.domain.TimeSlot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TimeSlotRepository
        extends JpaRepository<TimeSlot, Long> {

    @EntityGraph(attributePaths = "staff")
    List<TimeSlot>
    findByStaff_UserIdOrderBySlotDateAscStartTimeAsc(
            Long staffId
    );

    @EntityGraph(attributePaths = "staff")
    List<TimeSlot>
    findByAvailableTrueAndAppointmentTypeAndStaff_DepartmentIgnoreCaseOrderBySlotDateAscStartTimeAsc(
            String appointmentType,
            String department
    );

    @EntityGraph(attributePaths = "staff")
    List<TimeSlot>
    findAllByOrderBySlotDateAscStartTimeAsc();

    @Override
    @EntityGraph(attributePaths = "staff")
    Optional<TimeSlot> findById(Long id);

    boolean existsByStaff_UserId(Long staffId);

    @EntityGraph(attributePaths = "staff")
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select slot from TimeSlot slot where slot.slotId = :slotId")
    Optional<TimeSlot> findByIdForUpdate(@Param("slotId") Long slotId);
}