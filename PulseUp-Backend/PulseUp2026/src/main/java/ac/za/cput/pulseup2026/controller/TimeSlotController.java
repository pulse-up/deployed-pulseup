package ac.za.cput.pulseup2026.controller;

import ac.za.cput.pulseup2026.domain.TimeSlot;
import ac.za.cput.pulseup2026.request.CreateTimeSlotRequest;
import ac.za.cput.pulseup2026.response.TimeSlotResponse;
import ac.za.cput.pulseup2026.service.TimeSlotService;
import ac.za.cput.pulseup2026.util.JwtClaims;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/time-slots")
public class TimeSlotController {

    private final TimeSlotService timeSlotService;

    public TimeSlotController(TimeSlotService timeSlotService) {
        this.timeSlotService = timeSlotService;
    }

    @PostMapping(params = {
            "staffId",
            "slotDate",
            "startTime",
            "endTime",
            "appointmentType",
            "roomNumber"
    })
    public ResponseEntity<TimeSlotResponse> createTimeSlot(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam Long staffId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate slotDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
            LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
            LocalTime endTime,
            @RequestParam String appointmentType,
            @RequestParam String roomNumber,
            @RequestParam(defaultValue = "20") int estimatedDurationMinutes
    ) {
        if (!canManageStaff(jwt, staffId)) {
            return forbidden();
        }

        return created(timeSlotService.createTimeSlot(
                staffId,
                slotDate,
                startTime,
                endTime,
                appointmentType,
                roomNumber,
                estimatedDurationMinutes
        ));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TimeSlotResponse> createTimeSlotFromJson(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) CreateTimeSlotRequest request
    ) {
        if (request == null) {
            return ResponseEntity.badRequest().build();
        }

        if (!canManageStaff(jwt, request.getStaffId())) {
            return forbidden();
        }

        return created(timeSlotService.createTimeSlot(
                request.getStaffId(),
                request.getSlotDate(),
                request.getStartTime(),
                request.getEndTime(),
                request.getAppointmentType(),
                request.getRoomNumber(),
                request.getEstimatedDurationMinutes()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TimeSlotResponse> getTimeSlotById(
            @PathVariable Long id
    ) {
        TimeSlot slot = timeSlotService.getTimeSlotById(id);
        return slot == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(TimeSlotResponse.from(slot));
    }

    @GetMapping
    public ResponseEntity<List<TimeSlotResponse>> getTimeSlots(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String appointmentType
    ) {
        List<TimeSlot> slots;

        if (appointmentType != null && !appointmentType.isBlank()) {
            slots = timeSlotService.getAvailableTimeSlotsByType(appointmentType);
        } else if (JwtClaims.hasRole(jwt, "STUDENT")) {
            slots = timeSlotService.getAvailableFutureTimeSlots();
        } else {
            slots = timeSlotService.getAllTimeSlots();
        }

        return ResponseEntity.ok(toResponses(slots));
    }

    @GetMapping("/staff/{staffId}")
    public ResponseEntity<List<TimeSlotResponse>> getStaffTimeSlots(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long staffId
    ) {
        if (!canManageStaff(jwt, staffId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(
                toResponses(timeSlotService.getTimeSlotsByStaffId(staffId))
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimeSlotResponse> updateTimeSlot(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam Long staffId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate slotDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
            LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
            LocalTime endTime,
            @RequestParam String appointmentType,
            @RequestParam String roomNumber,
            @RequestParam(defaultValue = "20") int estimatedDurationMinutes
    ) {
        if (!canManageStaff(jwt, staffId)) {
            return forbidden();
        }

        TimeSlot slot = timeSlotService.getTimeSlotById(id);

        if (slot == null) {
            return ResponseEntity.badRequest().build();
        }

        if (!JwtClaims.hasRole(jwt, "ADMIN") &&
                !JwtClaims.getUserId(jwt).equals(slot.getStaff().getUserId())) {
            return forbidden();
        }

        TimeSlot updated = timeSlotService.updateTimeSlot(
                id,
                staffId,
                slotDate,
                startTime,
                endTime,
                appointmentType,
                roomNumber,
                estimatedDurationMinutes
        );

        return updated == null
                ? ResponseEntity.badRequest().build()
                : ResponseEntity.ok(TimeSlotResponse.from(updated));
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<TimeSlotResponse> setAvailability(
            @PathVariable Long id,
            @RequestParam boolean available
    ) {
        TimeSlot updated = timeSlotService.setAvailability(id, available);
        return updated == null
                ? ResponseEntity.badRequest().build()
                : ResponseEntity.ok(TimeSlotResponse.from(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTimeSlot(@PathVariable Long id) {
        return timeSlotService.deleteTimeSlot(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.badRequest().build();
    }

    private boolean canManageStaff(Jwt jwt, Long staffId) {
        return JwtClaims.hasRole(jwt, "ADMIN") ||
                (JwtClaims.hasRole(jwt, "STAFF") &&
                        JwtClaims.canActForUser(jwt, staffId));
    }

    private ResponseEntity<TimeSlotResponse> created(TimeSlot slot) {
        return slot == null
                ? ResponseEntity.badRequest().build()
                : ResponseEntity.status(HttpStatus.CREATED)
                .body(TimeSlotResponse.from(slot));
    }

    private ResponseEntity<TimeSlotResponse> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    private List<TimeSlotResponse> toResponses(List<TimeSlot> slots) {
        return slots.stream().map(TimeSlotResponse::from).toList();
    }
}
