package ac.za.cput.pulseup2026.repository;

import ac.za.cput.pulseup2026.domain.SickNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SickNoteRepository extends JpaRepository<SickNote, Long> {

    boolean existsByAppointment_AppointmentId(Long appointmentId);

    @Query("""
            select sickNote from SickNote sickNote
            join fetch sickNote.student student
            join fetch sickNote.appointment appointment
            join fetch appointment.timeSlot timeSlot
            join fetch timeSlot.staff staff
            left join fetch sickNote.reviewedBy reviewer
            left join fetch sickNote.signedByStaff signer
            where student.userId = :studentId
            order by sickNote.createdAt desc
            """)
    List<SickNote> findByStudentIdOrderByCreatedAtDesc(
            @Param("studentId") Long studentId
    );

    @Query("""
            select sickNote from SickNote sickNote
            join fetch sickNote.student student
            join fetch sickNote.appointment appointment
            join fetch appointment.timeSlot timeSlot
            join fetch timeSlot.staff staff
            left join fetch sickNote.reviewedBy reviewer
            left join fetch sickNote.signedByStaff signer
            where staff.userId = :staffId
            order by sickNote.createdAt desc
            """)
    List<SickNote> findAssignedToStaffOrderByCreatedAtDesc(
            @Param("staffId") Long staffId
    );

    @Query("""
            select sickNote from SickNote sickNote
            join fetch sickNote.student student
            join fetch sickNote.appointment appointment
            join fetch appointment.timeSlot timeSlot
            join fetch timeSlot.staff staff
            left join fetch sickNote.reviewedBy reviewer
            left join fetch sickNote.signedByStaff signer
            order by sickNote.createdAt desc
            """)
    List<SickNote> findAllDetailedOrderByCreatedAtDesc();

    @Query("""
            select sickNote from SickNote sickNote
            join fetch sickNote.student student
            join fetch sickNote.appointment appointment
            join fetch appointment.timeSlot timeSlot
            join fetch timeSlot.staff staff
            left join fetch sickNote.reviewedBy reviewer
            left join fetch sickNote.signedByStaff signer
            where sickNote.sickNoteId = :sickNoteId
            """)
    Optional<SickNote> findDetailedById(
            @Param("sickNoteId") Long sickNoteId
    );
}
