package ac.za.cput.pulseup2026.controller;

import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.service.StaffService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(
            StaffService staffService
    ) {
        this.staffService = staffService;
    }

    /*
     * Returns only the currently authenticated
     * staff member's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<Staff> getCurrentStaff(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long staffId = getUserId(jwt);

        if (staffId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        Staff staff =
                staffService.getStaffById(staffId);

        if (staff == null) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(staff);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Staff> getStaffById(
            @PathVariable Long id
    ) {
        Staff staff =
                staffService.getStaffById(id);

        if (staff == null) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(staff);
    }

    @GetMapping
    public ResponseEntity<List<Staff>> getAllStaff() {
        return ResponseEntity.ok(
                staffService.getAllStaff()
        );
    }

    @PutMapping
    public ResponseEntity<Staff> updateStaff(
            @RequestBody Staff staff
    ) {
        Staff updatedStaff =
                staffService.updateStaff(staff);

        if (updatedStaff == null) {
            return ResponseEntity
                    .badRequest()
                    .build();
        }

        return ResponseEntity.ok(updatedStaff);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStaff(
            @PathVariable Long id
    ) {
        boolean deleted =
                staffService.deleteStaff(id);

        if (!deleted) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity
                .noContent()
                .build();
    }

    private Long getUserId(Jwt jwt) {
        if (jwt == null) {
            return null;
        }

        Object userIdClaim =
                jwt.getClaim("userId");

        if (userIdClaim instanceof Number number) {
            return number.longValue();
        }

        if (userIdClaim instanceof String value) {
            try {
                return Long.parseLong(value);
            } catch (NumberFormatException exception) {
                return null;
            }
        }

        return null;
    }
}