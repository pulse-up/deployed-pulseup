package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.Appointment;
import ac.za.cput.pulseup2026.domain.HealthPointReason;
import ac.za.cput.pulseup2026.domain.HealthPointTransaction;
import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.repository.HealthPointTransactionRepository;
import ac.za.cput.pulseup2026.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HealthPointService {

    private final HealthPointTransactionRepository
            healthPointTransactionRepository;

    private final StudentRepository studentRepository;

    private final FoodVoucherService foodVoucherService;

    public HealthPointService(
            HealthPointTransactionRepository
                    healthPointTransactionRepository,

            StudentRepository studentRepository,

            FoodVoucherService foodVoucherService
    ) {
        this.healthPointTransactionRepository =
                healthPointTransactionRepository;

        this.studentRepository =
                studentRepository;

        this.foodVoucherService =
                foodVoucherService;
    }

    @Transactional
    public boolean awardForCompletedAppointment(
            Appointment appointment
    ) {
        if (
                appointment == null ||
                        appointment.getAppointmentId() == null ||
                        appointment.getStudent() == null ||
                        !"COMPLETED".equals(
                                appointment.getStatus()
                        )
        ) {
            return false;
        }

        boolean alreadyAwarded =
                healthPointTransactionRepository
                        .existsByAppointmentAppointmentId(
                                appointment
                                        .getAppointmentId()
                        );

        if (alreadyAwarded) {
            return false;
        }

        Student student =
                appointment.getStudent();

        HealthPointTransaction transaction =
                HealthPointTransaction.create(
                        student,
                        appointment,
                        FoodVoucherService
                                .POINTS_PER_COMPLETED_VISIT,
                        HealthPointReason
                                .COMPLETED_APPOINTMENT
                );

        if (transaction == null) {
            return false;
        }

        student.addHealthPoints(
                FoodVoucherService
                        .POINTS_PER_COMPLETED_VISIT
        );

        studentRepository.save(student);

        healthPointTransactionRepository.save(
                transaction
        );

        foodVoucherService.issueEligibleVouchers(
                student
        );

        return true;
    }
}