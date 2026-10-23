package ac.za.cput.pulseup2026.repository;

import ac.za.cput.pulseup2026.domain.Appointment;
import ac.za.cput.pulseup2026.domain.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface AppointmentRepository
        extends JpaRepository<Appointment, Long> {

    List<Appointment> findByStudent(Student student);

    List<Appointment> findByStatus(String status);

    boolean existsByTimeSlot_SlotId(Long slotId);

    boolean existsByTimeSlot_SlotIdAndStatusIn(
            Long slotId,
            Set<String> statuses
    );

    @Query("""
            select a from Appointment a
            join fetch a.timeSlot timeSlot
            join fetch timeSlot.staff staff
            where a.student.userId = :studentId
            order by timeSlot.slotDate asc,
                     timeSlot.startTime asc
            """)
    List<Appointment> findAppointmentsForStudent(
            @Param("studentId") Long studentId
    );

    @Query("""
            select a from Appointment a
            join fetch a.timeSlot timeSlot
            join fetch timeSlot.staff staff
            where staff.userId = :staffId
            order by timeSlot.slotDate asc,
                     timeSlot.startTime asc
            """)
    List<Appointment> findAppointmentsForStaff(
            @Param("staffId") Long staffId
    );

    @Query("""
            select a from Appointment a
            join fetch a.student student
            join fetch a.timeSlot timeSlot
            join fetch timeSlot.staff staff
            where a.appointmentId = :appointmentId
            """)
    Optional<Appointment> findDetailedById(
            @Param("appointmentId") Long appointmentId
    );

    @Query("""
            select a from Appointment a
            join fetch a.timeSlot timeSlot
            join fetch timeSlot.staff staff
            where staff.userId = :staffId
              and timeSlot.slotDate = :slotDate
            order by timeSlot.startTime asc,
                     a.createdAt asc
            """)
    List<Appointment> findQueueForStaffAndDate(
            @Param("staffId") Long staffId,
            @Param("slotDate") LocalDate slotDate
    );
}