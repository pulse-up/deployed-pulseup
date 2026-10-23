package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.Appointment;
import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.domain.TimeSlot;
import ac.za.cput.pulseup2026.domain.YearOfStudy;
import ac.za.cput.pulseup2026.factory.AppointmentFactory;
import ac.za.cput.pulseup2026.factory.StaffFactory;
import ac.za.cput.pulseup2026.factory.StudentFactory;
import ac.za.cput.pulseup2026.repository.AppointmentRepository;
import ac.za.cput.pulseup2026.repository.StudentRepository;
import ac.za.cput.pulseup2026.repository.TimeSlotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    private static final Long STUDENT_ID = 10L;
    private static final Long SLOT_ID = 20L;
    private static final Long APPOINTMENT_ID = 30L;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private HealthPointService healthPointService;

    @InjectMocks
    private AppointmentService appointmentService;

    /*
     * T-04: Booking an available slot must create a PENDING appointment whose type
     * comes from that slot, reserve the slot, persist the slot first, and then save
     * the appointment with the selected student and supplied notes.
     */
    @Test
    void shouldReserveAvailableSlotWhenAppointmentIsCreated() {
        Student student = createStudent();
        TimeSlot slot = createTimeSlot(true);
        assertNotNull(student);
        assertNotNull(slot);
        when(studentRepository.findById(STUDENT_ID))
                .thenReturn(Optional.of(student));
        when(timeSlotRepository.findByIdForUpdate(SLOT_ID))
                .thenReturn(Optional.of(slot));
        when(timeSlotRepository.save(slot)).thenReturn(slot);
        when(appointmentRepository.save(any(Appointment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Appointment result = appointmentService.createAppointment(
                STUDENT_ID,
                SLOT_ID,
                "Headache"
        );

        assertNotNull(result);
        assertSame(student, result.getStudent());
        assertSame(slot, result.getTimeSlot());
        assertEquals("General Consultation", result.getAppointmentType());
        assertEquals("PENDING", result.getStatus());
        assertEquals("Headache", result.getNotes());
        assertFalse(slot.isAvailable());

        InOrder saveOrder = inOrder(timeSlotRepository, appointmentRepository);
        saveOrder.verify(timeSlotRepository).save(slot);
        saveOrder.verify(appointmentRepository).save(result);
        verifyNoInteractions(healthPointService);
    }

    /*
     * T-05: An unavailable slot cannot be booked. The service must reject the
     * request with null and must not save either the slot or a new appointment.
     */
    @Test
    void shouldRejectAppointmentWhenSlotIsUnavailable() {
        Student student = createStudent();
        TimeSlot slot = createTimeSlot(false);
        assertNotNull(student);
        assertNotNull(slot);
        when(studentRepository.findById(STUDENT_ID))
                .thenReturn(Optional.of(student));
        when(timeSlotRepository.findByIdForUpdate(SLOT_ID))
                .thenReturn(Optional.of(slot));

        Appointment result = appointmentService.createAppointment(
                STUDENT_ID,
                SLOT_ID,
                "Headache"
        );

        assertNull(result);
        assertFalse(slot.isAvailable());
        verify(studentRepository).findById(STUDENT_ID);
        verify(timeSlotRepository).findByIdForUpdate(SLOT_ID);
        verify(timeSlotRepository, never()).save(any(TimeSlot.class));
        verifyNoInteractions(appointmentRepository, healthPointService);
    }

    /*
     * T-06: Cancelling a non-completed appointment keeps the appointment record,
     * changes its status to CANCELLED, releases its reserved slot, and saves both
     * changed objects instead of deleting the appointment.
     */
    @Test
    void shouldCancelAppointmentAndReleaseItsSlot() {
        Student student = createStudent();
        TimeSlot slot = createTimeSlot(true);
        Appointment appointment = AppointmentFactory.createAppointment(
                student,
                slot,
                "Headache"
        );
        assertNotNull(appointment);
        slot.reserve();
        when(appointmentRepository.findDetailedById(APPOINTMENT_ID))
                .thenReturn(Optional.of(appointment));
        when(timeSlotRepository.save(slot)).thenReturn(slot);
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        Appointment result = appointmentService.cancelAppointment(
                APPOINTMENT_ID,
                null,
                true
        );

        assertNotNull(result);
        assertSame(appointment, result);
        assertEquals("CANCELLED", result.getStatus());
        assertTrue(slot.isAvailable());
        verify(appointmentRepository).findDetailedById(APPOINTMENT_ID);
        verify(timeSlotRepository).save(slot);
        verify(appointmentRepository).save(appointment);
        verify(appointmentRepository, never()).deleteById(anyLong());
        verifyNoInteractions(studentRepository, healthPointService);
    }

    /*
     * T-07: Single-appointment retrieval must use findDetailedById so associated
     * Student, TimeSlot, and Staff data are available. The service must return the
     * exact appointment and preserve its current ID and status.
     */
    @Test
    void shouldRetrieveAppointmentWithItsCurrentStatus() {
        Student student = createStudent();
        TimeSlot slot = createTimeSlot(true);
        Appointment appointment = AppointmentFactory.createAppointment(
                student,
                slot,
                "Headache"
        );
        assertNotNull(appointment);
        ReflectionTestUtils.setField(
                appointment,
                "appointmentId",
                APPOINTMENT_ID
        );
        when(appointmentRepository.findDetailedById(APPOINTMENT_ID))
                .thenReturn(Optional.of(appointment));

        Appointment result = appointmentService.getAppointmentById(APPOINTMENT_ID);

        assertNotNull(result);
        assertSame(appointment, result);
        assertEquals(APPOINTMENT_ID, result.getAppointmentId());
        assertEquals("PENDING", result.getStatus());
        verify(appointmentRepository).findDetailedById(APPOINTMENT_ID);
        verify(appointmentRepository, never()).findById(anyLong());
        verifyNoInteractions(
                studentRepository,
                timeSlotRepository,
                healthPointService
        );
    }

    private Student createStudent() {
        return StudentFactory.createStudent(
                "student@pulseup.co.za",
                "encoded-password",
                "Lwazi",
                "Mbeki",
                "0825550100",
                "STU-001",
                "Information Technology",
                "District Six",
                "Student Residence",
                YearOfStudy.FIRST_YEAR,
                "Nomsa Mbeki",
                "0835550101"
        );
    }

    private TimeSlot createTimeSlot(boolean available) {
        Staff staff = StaffFactory.createStaff(
                "nurse@pulseup.co.za",
                "encoded-password",
                "Nandi",
                "Jacobs",
                "0215550102",
                "STF-001",
                "Student Wellness",
                "Nurse",
                "Primary Care"
        );

        return TimeSlot.builder()
                .staff(staff)
                .slotDate(LocalDate.of(2026, 10, 8))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 20))
                .appointmentType("General Consultation")
                .roomNumber("Clinic 1")
                .estimatedDurationMinutes(20)
                .available(available)
                .build();
    }
}
