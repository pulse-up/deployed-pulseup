package ac.za.cput.pulseup2026.controller;

import ac.za.cput.pulseup2026.request.AuthResponse;
import ac.za.cput.pulseup2026.request.LoginRequest;
import ac.za.cput.pulseup2026.request.RegisterStaffRequest;
import ac.za.cput.pulseup2026.request.RegisterStudentRequest;
import ac.za.cput.pulseup2026.request.StudentPasswordRecoveryRequest;
import ac.za.cput.pulseup2026.response.StaffCreationResponse;
import ac.za.cput.pulseup2026.service.AuthService;
import ac.za.cput.pulseup2026.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final StudentService studentService;

    public AuthController(
            AuthService authService,
            StudentService studentService
    ) {
        this.authService = authService;
        this.studentService = studentService;
    }

    @PostMapping("/register/student")
    public ResponseEntity<AuthResponse> registerStudent(
            @RequestBody RegisterStudentRequest request
    ) {
        AuthResponse response =
                authService.registerStudent(request);

        if (response == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/register/staff")
    public ResponseEntity<StaffCreationResponse> registerStaff(
            @RequestBody RegisterStaffRequest request
    ) {
        StaffCreationResponse response =
                authService.registerStaff(request);

        if (response == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/student/password-recovery")
    public ResponseEntity<Void> recoverStudentPassword(
            @RequestBody StudentPasswordRecoveryRequest request
    ) {
        return studentService.recoverPassword(request)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.badRequest().build();
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(request);

        if (response == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        return ResponseEntity.ok(response);
    }
}
