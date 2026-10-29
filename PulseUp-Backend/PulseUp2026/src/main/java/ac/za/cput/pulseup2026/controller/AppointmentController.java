package ac.za.cput.pulseup2026.controller;

import ac.za.cput.pulseup2026.domain.Appointment;
import ac.za.cput.pulseup2026.response.AppointmentQueueResponse;
import ac.za.cput.pulseup2026.service.AppointmentService;
import ac.za.cput.pulseup2026.service.SlotUnavailableException;
import ac.za.cput.pulseup2026.util.JwtClaims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@AuthenticationPrincipal Jwt jwt,
            @RequestParam Long slotId, @RequestParam(required = false) String notes) {
        Long studentId = JwtClaims.getUserId(jwt);
        if (studentId == null || !JwtClaims.hasRole(jwt, "STUDENT")) return forbidden();
        if (notes != null && notes.trim().length() > 255) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Appointment saved = appointmentService.createAppointment(studentId, slotId, notes);
            return saved == null
                    ? ResponseEntity.badRequest().build()
                    : ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (SlotUnavailableException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @GetMapping("/my-queue")
    public ResponseEntity<List<AppointmentQueueResponse>> getMyQueue(@AuthenticationPrincipal Jwt jwt) {
        Long studentId = JwtClaims.getUserId(jwt);
        if (studentId == null || !JwtClaims.hasRole(jwt, "STUDENT")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(appointmentService.getQueueForStudent(studentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Appointment appointment = appointmentService.getAppointmentById(id);
        if (appointment == null) return ResponseEntity.notFound().build();
        boolean allowed = appointmentService.canViewAppointment(appointment, JwtClaims.getUserId(jwt),
                JwtClaims.hasRole(jwt, "STUDENT"), JwtClaims.hasRole(jwt, "STAFF"),
                JwtClaims.hasRole(jwt, "ADMIN"));
        return allowed ? ResponseEntity.ok(appointment) : forbidden();
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Appointment>> getStudentAppointments(@PathVariable Long studentId,
            @AuthenticationPrincipal Jwt jwt) {
        boolean admin = JwtClaims.hasRole(jwt, "ADMIN");
        if (!admin && (!JwtClaims.hasRole(jwt, "STUDENT") ||
                !studentId.equals(JwtClaims.getUserId(jwt)))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(appointmentService.getAppointmentsByStudentId(studentId));
    }

    @GetMapping("/staff/{staffId}")
    public ResponseEntity<List<Appointment>> getStaffAppointments(@PathVariable Long staffId,
            @AuthenticationPrincipal Jwt jwt) {
        boolean admin = JwtClaims.hasRole(jwt, "ADMIN");
        if (!admin && (!JwtClaims.hasRole(jwt, "STAFF") ||
                !staffId.equals(JwtClaims.getUserId(jwt)))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(appointmentService.getAppointmentsByStaffId(staffId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(@PathVariable Long id, @RequestParam String status,
            @AuthenticationPrincipal Jwt jwt) {
        boolean admin = JwtClaims.hasRole(jwt, "ADMIN");
        if (!admin && !JwtClaims.hasRole(jwt, "STAFF")) return forbidden();
        Appointment updated = appointmentService.updateAppointmentStatus(id, status,
                JwtClaims.getUserId(jwt), admin);
        return updated == null ? ResponseEntity.badRequest().build() : ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Appointment> cancelAppointment(@PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        boolean admin = JwtClaims.hasRole(jwt, "ADMIN");
        if (!admin && !JwtClaims.hasRole(jwt, "STUDENT")) return forbidden();
        Appointment cancelled = appointmentService.cancelAppointment(id, JwtClaims.getUserId(jwt), admin);
        return cancelled == null ? forbidden() : ResponseEntity.ok(cancelled);
    }

    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<Appointment> rescheduleAppointment(@PathVariable Long id,
            @RequestParam Long slotId, @AuthenticationPrincipal Jwt jwt) {
        boolean admin = JwtClaims.hasRole(jwt, "ADMIN");
        if (!admin && !JwtClaims.hasRole(jwt, "STUDENT")) return forbidden();
        try {
            Appointment updated = appointmentService.rescheduleAppointment(id, slotId,
                    JwtClaims.getUserId(jwt), admin);
            return updated == null
                    ? ResponseEntity.badRequest().build()
                    : ResponseEntity.ok(updated);
        } catch (SlotUnavailableException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        return appointmentService.deleteAppointment(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    private ResponseEntity<Appointment> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
}
