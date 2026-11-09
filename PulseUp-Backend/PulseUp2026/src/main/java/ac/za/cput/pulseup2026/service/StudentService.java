package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.repository.AppointmentRepository;
import ac.za.cput.pulseup2026.repository.FoodVoucherRepository;
import ac.za.cput.pulseup2026.repository.HealthPointTransactionRepository;
import ac.za.cput.pulseup2026.repository.SickNoteRepository;
import ac.za.cput.pulseup2026.repository.StudentRepository;
import ac.za.cput.pulseup2026.request.StudentPasswordRecoveryRequest;
import ac.za.cput.pulseup2026.request.StudentProfileRequest;
import ac.za.cput.pulseup2026.util.StudentIdentityValidator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional(readOnly = true)
public class StudentService {

    private static final int MAX_RECOVERY_ATTEMPTS = 5;
    private static final Duration RECOVERY_WINDOW = Duration.ofMinutes(15);

    private final StudentRepository studentRepository;
    private final AppointmentRepository appointmentRepository;
    private final SickNoteRepository sickNoteRepository;
    private final HealthPointTransactionRepository healthPointTransactionRepository;
    private final FoodVoucherRepository foodVoucherRepository;
    private final PasswordEncoder passwordEncoder;
    private final Map<String, RecoveryAttempt> recoveryAttempts =
            new ConcurrentHashMap<>();

    public enum DeleteResult {
        DELETED,
        NOT_FOUND,
        HAS_LINKED_RECORDS
    }

    public StudentService(
            StudentRepository studentRepository,
            AppointmentRepository appointmentRepository,
            SickNoteRepository sickNoteRepository,
            HealthPointTransactionRepository healthPointTransactionRepository,
            FoodVoucherRepository foodVoucherRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.studentRepository = studentRepository;
        this.appointmentRepository = appointmentRepository;
        this.sickNoteRepository = sickNoteRepository;
        this.healthPointTransactionRepository = healthPointTransactionRepository;
        this.foodVoucherRepository = foodVoucherRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Student saveStudent(Student student) {
        if (
                student == null ||
                        !StudentIdentityValidator.isMatchingIdentity(
                                student.getEmail(),
                                student.getStudentNumber()
                        )
        ) {
            return null;
        }

        String studentNumber =
                student.getStudentNumber().trim();

        if (
                studentRepository.existsByStudentNumber(
                        studentNumber
                )
        ) {
            return null;
        }

        return studentRepository.save(student);
    }

    @Transactional
    public boolean changePassword(
            Long studentId,
            String currentPassword,
            String newPassword
    ) {
        if (
                studentId == null ||
                        isBlank(currentPassword) ||
                        isBlank(newPassword) ||
                        newPassword.length() < 8
        ) {
            return false;
        }

        Student student = studentRepository
                .findById(studentId)
                .orElse(null);

        if (student == null || !student.isActive()) {
            return false;
        }

        String currentHash = student.getPasswordHash();

        if (
                !passwordEncoder.matches(
                        currentPassword,
                        currentHash
                ) ||
                        passwordEncoder.matches(
                                newPassword,
                                currentHash
                        )
        ) {
            return false;
        }

        student.changePasswordHash(
                passwordEncoder.encode(newPassword)
        );
        studentRepository.saveAndFlush(student);
        return true;
    }

    @Transactional
    public boolean recoverPassword(
            StudentPasswordRecoveryRequest request
    ) {
        if (
                request == null ||
                        !StudentIdentityValidator.isMatchingIdentity(
                                request.getEmail(),
                                request.getStudentNumber()
                        ) ||
                        !isValidPhoneNumber(request.getPhoneNumber()) ||
                        !isValidPhoneNumber(request.getEmergencyContactPhone()) ||
                        isBlank(request.getNewPassword()) ||
                        request.getNewPassword().length() < 8
        ) {
            return false;
        }

        String email = normaliseEmail(request.getEmail());
        if (isRecoveryBlocked(email)) {
            return false;
        }

        Student student = studentRepository
                .findByEmailIgnoreCase(email)
                .orElse(null);
        boolean identityMatches = student != null &&
                student.isActive() &&
                Objects.equals(
                        student.getStudentNumber(),
                        request.getStudentNumber().trim()
                ) &&
                Objects.equals(
                        student.getPhoneNumber(),
                        request.getPhoneNumber().trim()
                ) &&
                Objects.equals(
                        student.getEmergencyContactPhone(),
                        request.getEmergencyContactPhone().trim()
                );

        if (
                !identityMatches ||
                        passwordEncoder.matches(
                                request.getNewPassword(),
                                student.getPasswordHash()
                        )
        ) {
            recordRecoveryFailure(email);
            return false;
        }

        student.changePasswordHash(
                passwordEncoder.encode(request.getNewPassword())
        );
        studentRepository.saveAndFlush(student);
        recoveryAttempts.remove(email);
        return true;
    }

    public Student getStudentById(Long id) {
        if (id == null) {
            return null;
        }

        return studentRepository
                .findById(id)
                .orElse(null);
    }

    public List<Student> getAllStudents() {
        return studentRepository
                .findAllByActiveTrue();
    }

    public List<Student> getInactiveStudents() {
        return studentRepository
                .findAllByActiveFalse();
    }

    @Transactional
    public Student updateStudent(
            Student submittedStudent
    ) {
        if (
                submittedStudent == null ||
                        submittedStudent.getUserId() == null
        ) {
            return null;
        }

        Student existingStudent =
                studentRepository
                        .findById(
                                submittedStudent.getUserId()
                        )
                        .orElse(null);

        if (
                existingStudent == null ||
                        !StudentIdentityValidator.isMatchingIdentity(
                                submittedStudent.getEmail(),
                                existingStudent.getStudentNumber()
                        )
        ) {
            return null;
        }

        Student emailOwner = studentRepository
                .findByEmailIgnoreCase(
                        normaliseEmail(submittedStudent.getEmail())
                )
                .orElse(null);

        if (
                emailOwner != null &&
                        !emailOwner.getUserId().equals(
                                existingStudent.getUserId()
                        )
        ) {
            return null;
        }

        existingStudent.updateProfile(
                cleanRequired(
                        submittedStudent.getFirstName()
                ),
                cleanRequired(
                        submittedStudent.getLastName()
                ),
                normaliseEmail(
                        submittedStudent.getEmail()
                ),
                cleanRequired(
                        submittedStudent.getPhoneNumber()
                ),
                cleanRequired(
                        submittedStudent.getCourse()
                ),
                cleanRequired(
                        submittedStudent.getCampus()
                ),
                cleanRequired(
                        submittedStudent.getResidence()
                ),
                submittedStudent.getYearOfStudy(),
                cleanOptional(
                        submittedStudent
                                .getEmergencyContactName()
                ),
                cleanOptional(
                        submittedStudent
                                .getEmergencyContactPhone()
                )
        );

        return studentRepository.save(
                existingStudent
        );
    }

    @Transactional
    public Student updateStudentProfileById(
            Long studentId,
            StudentProfileRequest request
    ) {
        if (
                studentId == null ||
                        !isValidProfileRequest(request)
        ) {
            return null;
        }

        Student student =
                studentRepository
                        .findById(studentId)
                        .orElse(null);

        if (
                student == null ||
                        !student.isActive() ||
                        !StudentIdentityValidator.isMatchingIdentity(
                                request.getEmail(),
                                student.getStudentNumber()
                        )
        ) {
            return null;
        }

        Student emailOwner = studentRepository
                .findByEmailIgnoreCase(request.getEmail().trim())
                .orElse(null);

        if (emailOwner != null &&
                !emailOwner.getUserId().equals(student.getUserId())) {
            return null;
        }

        applyProfileUpdate(
                student,
                request
        );

        return studentRepository.save(student);
    }

    @Transactional
    public DeleteResult deleteStudent(Long id) {
        if (id == null) {
            return DeleteResult.NOT_FOUND;
        }

        Student student = studentRepository
                .findById(id)
                .orElse(null);

        if (student == null) {
            return DeleteResult.NOT_FOUND;
        }

        boolean hasLinkedRecords =
                appointmentRepository.existsByStudentUserId(id) ||
                        sickNoteRepository.existsByStudentUserId(id) ||
                        healthPointTransactionRepository.existsByStudentUserId(id) ||
                        foodVoucherRepository.existsByStudentUserId(id);

        if (hasLinkedRecords) {
            return DeleteResult.HAS_LINKED_RECORDS;
        }

        studentRepository.delete(student);
        studentRepository.flush();

        return DeleteResult.DELETED;
    }

    @Transactional
    public Student restoreStudent(Long id) {
        if (id == null) {
            return null;
        }

        Student student =
                studentRepository
                        .findById(id)
                        .orElse(null);

        if (student == null) {
            return null;
        }

        student.activate();

        return studentRepository.save(student);
    }

    private void applyProfileUpdate(
            Student student,
            StudentProfileRequest request
    ) {
        student.updateProfile(
                request.getFirstName().trim(),
                request.getLastName().trim(),
                normaliseEmail(
                        request.getEmail()
                ),
                request.getPhoneNumber().trim(),
                request.getCourse().trim(),
                request.getCampus().trim(),
                request.getResidence().trim(),
                request.getYearOfStudy(),
                cleanOptional(
                        request.getEmergencyContactName()
                ),
                cleanOptional(
                        request.getEmergencyContactPhone()
                )
        );
    }

    private boolean isValidProfileRequest(
            StudentProfileRequest request
    ) {
        return request != null
                && !isBlank(request.getFirstName())
                && !isBlank(request.getLastName())
                && isValidStudentEmail(request.getEmail())
                && isValidPhoneNumber(request.getPhoneNumber())
                && !isBlank(request.getCourse())
                && !isBlank(request.getCampus())
                && !isBlank(request.getResidence())
                && request.getYearOfStudy() != null
                && !isBlank(request.getEmergencyContactName())
                && isValidPhoneNumber(request.getEmergencyContactPhone());
    }

    private boolean isValidStudentEmail(String email) {
        return StudentIdentityValidator.isValidStudentEmail(email);
    }

    private boolean isValidPhoneNumber(String phoneNumber) {
        return !isBlank(phoneNumber)
                && phoneNumber.trim().matches("0\\d{9}");
    }

    private String normaliseEmail(
            String email
    ) {
        if (email == null) {
            return "";
        }

        return email
                .trim()
                .toLowerCase();
    }

    private String cleanRequired(
            String value
    ) {
        return value == null
                ? ""
                : value.trim();
    }

    private String cleanOptional(
            String value
    ) {
        if (isBlank(value)) {
            return null;
        }

        return value.trim();
    }

    private boolean isRecoveryBlocked(String email) {
        RecoveryAttempt attempt = recoveryAttempts.get(email);
        if (attempt == null) {
            return false;
        }
        if (Duration.between(attempt.startedAt(), Instant.now())
                .compareTo(RECOVERY_WINDOW) >= 0) {
            recoveryAttempts.remove(email);
            return false;
        }
        return attempt.count() >= MAX_RECOVERY_ATTEMPTS;
    }

    private void recordRecoveryFailure(String email) {
        recoveryAttempts.compute(email, (key, current) -> {
            Instant now = Instant.now();
            if (
                    current == null ||
                            Duration.between(current.startedAt(), now)
                                    .compareTo(RECOVERY_WINDOW) >= 0
            ) {
                return new RecoveryAttempt(1, now);
            }
            return new RecoveryAttempt(current.count() + 1, current.startedAt());
        });
    }

    private record RecoveryAttempt(int count, Instant startedAt) {
    }

    private boolean isBlank(
            String value
    ) {
        return value == null ||
                value.trim().isEmpty();
    }
}