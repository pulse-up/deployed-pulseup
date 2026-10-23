package ac.za.cput.pulseup2026.controller;

import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.request.ChangePasswordRequest;
import ac.za.cput.pulseup2026.request.StudentProfileRequest;
import ac.za.cput.pulseup2026.service.StudentService;
import ac.za.cput.pulseup2026.util.JwtClaims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(
            StudentService studentService
    ) {
        this.studentService = studentService;
    }

    @GetMapping("/me")
    public ResponseEntity<Student> getCurrentStudent(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long studentId = JwtClaims.getUserId(jwt);

        if (studentId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        Student student = studentService.getStudentById(studentId);

        if (student == null || !student.isActive()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(student);
    }

    @PutMapping("/me/profile")
    public ResponseEntity<Student> updateCurrentStudentProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody StudentProfileRequest request
    ) {
        Long studentId = JwtClaims.getUserId(jwt);

        if (studentId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        Student updatedStudent = studentService
                .updateStudentProfileById(studentId, request);

        if (updatedStudent == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(updatedStudent);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changeCurrentStudentPassword(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody ChangePasswordRequest request
    ) {
        Long studentId = JwtClaims.getUserId(jwt);

        if (
                studentId == null ||
                        request == null ||
                        !studentService.changePassword(
                                studentId,
                                request.getCurrentPassword(),
                                request.getNewPassword()
                        )
        ) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(
            @PathVariable Long id
    ) {
        Student student = studentService.getStudentById(id);

        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(student);
    }

    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/inactive/list")
    public ResponseEntity<List<Student>> getInactiveStudents() {
        return ResponseEntity.ok(studentService.getInactiveStudents());
    }

    @PutMapping
    public ResponseEntity<Student> updateStudent(
            @RequestBody Student student
    ) {
        Student updatedStudent = studentService.updateStudent(student);

        if (updatedStudent == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(updatedStudent);
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<Student> updateStudentProfileById(
            @PathVariable Long id,
            @RequestBody StudentProfileRequest request
    ) {
        Student updatedStudent = studentService
                .updateStudentProfileById(id, request);

        if (updatedStudent == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(updatedStudent);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(
            @PathVariable Long id
    ) {
        boolean deleted = studentService.deleteStudent(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<Student> restoreStudent(
            @PathVariable Long id
    ) {
        Student restoredStudent = studentService.restoreStudent(id);

        if (restoredStudent == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(restoredStudent);
    }
}
