package ac.za.cput.pulseup2026.repository;

import ac.za.cput.pulseup2026.domain.TimeSlot;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    /*
     * Atomically reserves a slot only while it is still available. The affected
     * row count is the booking decision, which works consistently on MySQL and
     * TiDB without a joined pessimistic-lock query.
     */
    @Modifying(flushAutomatically = true)
    @Query("""
            update TimeSlot slot
               set slot.available = false
             where slot.slotId = :slotId
               and slot.available = true
            """)
    int reserveIfAvailable(@Param("slotId") Long slotId);
}
