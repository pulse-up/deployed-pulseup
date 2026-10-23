package ac.za.cput.pulseup2026.controller;

import ac.za.cput.pulseup2026.request.CreateSickNoteRequest;
import ac.za.cput.pulseup2026.request.ReviewSickNoteRequest;
import ac.za.cput.pulseup2026.response.SickNoteResponse;
import ac.za.cput.pulseup2026.service.SickNoteService;
import ac.za.cput.pulseup2026.util.JwtClaims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sick-notes")
public class SickNoteController {

    private final SickNoteService sickNoteService;

    public SickNoteController(SickNoteService sickNoteService) {
        this.sickNoteService = sickNoteService;
    }

    @PostMapping({"", "/"})
    public ResponseEntity<SickNoteResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody CreateSickNoteRequest request
    ) {
        Long studentId = JwtClaims.getUserId(jwt);
        if (studentId == null || !JwtClaims.hasRole(jwt, "STUDENT")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        SickNoteResponse response = sickNoteService.create(studentId, request);
        return response == null
                ? ResponseEntity.badRequest().build()
                : ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<List<SickNoteResponse>> getMine(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long studentId = JwtClaims.getUserId(jwt);
        if (studentId == null || !JwtClaims.hasRole(jwt, "STUDENT")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(sickNoteService.getForStudent(studentId));
    }

    @GetMapping("/staff/me")
    public ResponseEntity<List<SickNoteResponse>> getAssignedToMe(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long staffId = JwtClaims.getUserId(jwt);
        if (staffId == null || !JwtClaims.hasRole(jwt, "STAFF")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(sickNoteService.getForStaff(staffId));
    }

    @GetMapping({"", "/"})
    public ResponseEntity<List<SickNoteResponse>> getAll(
            @AuthenticationPrincipal Jwt jwt
    ) {
        if (!JwtClaims.hasRole(jwt, "ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(sickNoteService.getAll());
    }

    @PatchMapping("/{id}/review")
    public ResponseEntity<SickNoteResponse> review(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody ReviewSickNoteRequest request
    ) {
        Long reviewerId = JwtClaims.getUserId(jwt);
        boolean staff = JwtClaims.hasRole(jwt, "STAFF");
        if (reviewerId == null || !staff) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (!sickNoteService.isAssignedToStaff(id, reviewerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        SickNoteResponse response = sickNoteService.review(
                id,
                reviewerId,
                request
        );
        return response == null
                ? ResponseEntity.badRequest().build()
                : ResponseEntity.ok(response);
    }
}
