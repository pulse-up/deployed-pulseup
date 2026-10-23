package ac.za.cput.pulseup2026.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "health_point_transactions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_health_points_appointment",
                        columnNames = "appointment_id"
                )
        }
)
public class HealthPointTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "student_id",
            nullable = false
    )
    private Student student;

    /*
     * One appointment may award health points only once.
     */
    @JsonIgnore
    @OneToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "appointment_id",
            nullable = false,
            unique = true
    )
    private Appointment appointment;

    @Column(nullable = false)
    private int points;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 50
    )
    private HealthPointReason reason;

    @Column(nullable = false)
    private LocalDateTime awardedAt;

    protected HealthPointTransaction() {
    }

    private HealthPointTransaction(
            Student student,
            Appointment appointment,
            int points,
            HealthPointReason reason
    ) {
        this.student = student;
        this.appointment = appointment;
        this.points = points;
        this.reason = reason;
        this.awardedAt = LocalDateTime.now();
    }

    public static HealthPointTransaction create(
            Student student,
            Appointment appointment,
            int points,
            HealthPointReason reason
    ) {
        if (
                student == null ||
                        appointment == null ||
                        points <= 0 ||
                        reason == null
        ) {
            return null;
        }

        return new HealthPointTransaction(
                student,
                appointment,
                points,
                reason
        );
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public Student getStudent() {
        return student;
    }

    public Appointment getAppointment() {
        return appointment;
    }

    public int getPoints() {
        return points;
    }

    public HealthPointReason getReason() {
        return reason;
    }

    public LocalDateTime getAwardedAt() {
        return awardedAt;
    }
}