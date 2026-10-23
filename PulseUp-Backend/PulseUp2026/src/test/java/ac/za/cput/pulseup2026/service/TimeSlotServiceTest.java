package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.TimeSlot;
import ac.za.cput.pulseup2026.repository.AppointmentRepository;
import ac.za.cput.pulseup2026.repository.StaffRepository;
import ac.za.cput.pulseup2026.repository.TimeSlotRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimeSlotServiceTest {

    private static final Long SLOT_ID = 82L;
    private static final Set<String> ACTIVE_STATUSES = Set.of(
            "PENDING",
            "RESCHEDULED",
            "CONFIRMED"
    );

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private StaffRepository staffRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    private TimeSlotService timeSlotService;
    private TimeSlot slot;

    @BeforeEach
    void setUp() {
        timeSlotService = new TimeSlotService(
                timeSlotRepository,
                staffRepository,
                appointmentRepository
        );
        slot = TimeSlot.builder()
                .slotDate(LocalDate.now().plusDays(30))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 20))
                .appointmentType("General Consultations")
                .roomNumber("Unit A1")
                .estimatedDurationMinutes(20)
                .available(false)
                .build();
        ReflectionTestUtils.setField(slot, "slotId", SLOT_ID);
    }

    @Test
    void shouldReopenSlotWhenOnlyCancelledHistoryRemains() {
        when(timeSlotRepository.findById(SLOT_ID))
                .thenReturn(Optional.of(slot));
        when(appointmentRepository
                .existsByTimeSlot_SlotIdAndStatusIn(
                        SLOT_ID,
                        ACTIVE_STATUSES
                )).thenReturn(false);
        when(timeSlotRepository.save(slot)).thenReturn(slot);

        TimeSlot result = timeSlotService.setAvailability(
                SLOT_ID,
                true
        );

        assertSame(slot, result);
        assertTrue(slot.isAvailable());
        verify(timeSlotRepository).save(slot);
    }

    @Test
    void shouldRejectReopenWhileActiveAppointmentOwnsSlot() {
        when(timeSlotRepository.findById(SLOT_ID))
                .thenReturn(Optional.of(slot));
        when(appointmentRepository
                .existsByTimeSlot_SlotIdAndStatusIn(
                        eq(SLOT_ID),
                        eq(ACTIVE_STATUSES)
                )).thenReturn(true);

        TimeSlot result = timeSlotService.setAvailability(
                SLOT_ID,
                true
        );

        assertNull(result);
        assertFalse(slot.isAvailable());
        verify(timeSlotRepository, never()).save(slot);
    }
}
