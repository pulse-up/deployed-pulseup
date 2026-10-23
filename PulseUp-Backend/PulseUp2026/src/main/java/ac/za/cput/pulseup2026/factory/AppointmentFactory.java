package ac.za.cput.pulseup2026.factory;

import ac.za.cput.pulseup2026.domain.Appointment;
import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.domain.TimeSlot;

public final class AppointmentFactory {

    private AppointmentFactory() {
    }

    public static Appointment createAppointment(
            Student student,
            TimeSlot timeSlot,
            String notes
    ) {
        if (student == null || timeSlot == null || !timeSlot.isAvailable() ||
                timeSlot.getAppointmentType() == null ||
                timeSlot.getAppointmentType().isBlank()) {
            return null;
        }

        return Appointment.builder()
                .student(student)
                .timeSlot(timeSlot)
                .notes(notes)
                .build();
    }
}
