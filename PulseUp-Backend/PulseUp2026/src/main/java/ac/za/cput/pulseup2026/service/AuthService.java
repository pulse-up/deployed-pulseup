package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.Admin;
import ac.za.cput.pulseup2026.domain.AppointmentType;
import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.domain.User;
import ac.za.cput.pulseup2026.factory.AdminFactory;
import ac.za.cput.pulseup2026.factory.StaffFactory;
import ac.za.cput.pulseup2026.factory.StudentFactory;
import ac.za.cput.pulseup2026.repository.AdminRepository;
import ac.za.cput.pulseup2026.repository.StaffRepository;
import ac.za.cput.pulseup2026.repository.StudentRepository;
import ac.za.cput.pulseup2026.repository.UserRepository;
import ac.za.cput.pulseup2026.request.AuthResponse;
import ac.za.cput.pulseup2026.request.LoginRequest;
import ac.za.cput.pulseup2026.request.RegisterAdminRequest;
import ac.za.cput.pulseup2026.request.RegisterStaffRequest;
import ac.za.cput.pulseup2026.request.RegisterStudentRequest;
import ac.za.cput.pulseup2026.response.StaffCreationResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StaffRepository staffRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            StaffRepository staffRepository,
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.staffRepository = staffRepository;
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse registerStudent(
            RegisterStudentRequest request
    ) {
        if (!isValidStudentRegistration(request)) {
            return null;
        }

        String email =
                normaliseEmail(request.getEmail());

        String studentNumber =
                request.getStudentNumber().trim();

        if (
                userRepository.existsByEmail(email) ||
                        studentRepository.existsByStudentNumber(
                                studentNumber
                        )
        ) {
            return null;
        }

        String encodedPassword =
                passwordEncoder.encode(
                        request.getPassword()
                );

        Student student =
                StudentFactory.createStudent(
                        email,
                        encodedPassword,
                        request.getFirstName().trim(),
                        request.getLastName().trim(),
                        request.getPhoneNumber().trim(),
                        studentNumber,
                        trimToNull(request.getCourse()),
                        request.getCampus().trim(),
                        trimToNull(request.getResidence()),
                        request.getYearOfStudy(),
                        trimToNull(request.getEmergencyContactName()),
                        trimToNull(request.getEmergencyContactPhone())
                );

        if (student == null) {
            return null;
        }

        Student savedStudent =
                studentRepository.save(student);

        return toAuthResponse(savedStudent);
    }

    @Transactional
    public StaffCreationResponse registerStaff(
            RegisterStaffRequest request
    ) {
        if (!isValidStaffRegistration(request)) {
            return null;
        }

        AppointmentType appointmentType =
                AppointmentType.fromValue(
                        request.getDepartment()
                );

        if (
                appointmentType == null ||
                        !appointmentType.isPositionAllowed(
                                request.getPosition()
                        )
        ) {
            return null;
        }

        String email =
                normaliseEmail(request.getEmail());

        String staffNumber =
                request.getStaffNumber().trim();

        if (
                userRepository.existsByEmail(email) ||
                        staffRepository.existsByStaffNumber(
                                staffNumber
                        )
        ) {
            return null;
        }

        Staff staff = StaffFactory.createStaff(
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getFirstName().trim(),
                request.getLastName().trim(),
                request.getPhoneNumber().trim(),
                staffNumber,
                appointmentType.getRequiredDepartment(),
                request.getPosition().trim(),
                request.getSpecialization().trim()
        );

        if (staff == null) {
            return null;
        }

        Staff savedStaff = staffRepository.save(staff);
        return StaffCreationResponse.from(savedStaff);
    }

    @Transactional
    public AuthResponse registerAdmin(
            RegisterAdminRequest request
    ) {
        if (!isValidAdminRegistration(request)) {
            return null;
        }

        String email =
                normaliseEmail(request.getEmail());

        String adminNumber =
                request.getAdminNumber().trim();

        if (
                userRepository.existsByEmail(email) ||
                        adminRepository.existsByAdminNumber(
                                adminNumber
                        )
        ) {
            return null;
        }

        Admin admin =
                AdminFactory.createAdmin(
                        email,
                        passwordEncoder.encode(
                                request.getPassword()
                        ),
                        request.getFirstName().trim(),
                        request.getLastName().trim(),
                        request.getPhoneNumber().trim(),
                        adminNumber,
                        request.getDepartment().trim()
                );

        if (admin == null) {
            return null;
        }

        Admin savedAdmin =
                adminRepository.save(admin);

        return toAuthResponse(savedAdmin);
    }

    public AuthResponse login(
            LoginRequest request
    ) {
        if (
                request == null ||
                        isBlank(request.getEmail()) ||
                        isBlank(request.getPassword())
        ) {
            return null;
        }

        String email =
                normaliseEmail(request.getEmail());

        User user =
                userRepository
                        .findByEmail(email)
                        .orElse(null);

        if (
                user == null ||
                        !user.isActive()
        ) {
            return null;
        }

        boolean passwordMatches =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPasswordHash()
                );

        if (!passwordMatches) {
            return null;
        }

        return toAuthResponse(user);
    }

    private boolean isValidStudentRegistration(
            RegisterStudentRequest request
    ) {
        return request != null
                && isValidStudentEmail(request.getEmail())
                && !isBlank(request.getPassword())
                && request.getPassword().length() >= 8
                && !isBlank(request.getFirstName())
                && !isBlank(request.getLastName())
                && isValidPhoneNumber(request.getPhoneNumber())
                && !isBlank(request.getStudentNumber())
                && request.getStudentNumber().trim().matches("\\d{8,12}")
                && !isBlank(request.getCourse())
                && !isBlank(request.getCampus())
                && !isBlank(request.getResidence())
                && request.getYearOfStudy() != null
                && !isBlank(request.getEmergencyContactName())
                && isValidPhoneNumber(request.getEmergencyContactPhone());
    }

    private boolean isValidStaffRegistration(
            RegisterStaffRequest request
    ) {
        return request != null
                && isValidEmail(request.getEmail())
                && !isBlank(request.getPassword())
                && !isBlank(request.getFirstName())
                && !isBlank(request.getLastName())
                && isValidPhoneNumber(request.getPhoneNumber())
                && !isBlank(request.getStaffNumber())
                && !isBlank(request.getDepartment())
                && !isBlank(request.getPosition())
                && !isBlank(request.getSpecialization())
                && request.getPassword().length() >= 8;
    }

    private boolean isValidAdminRegistration(
            RegisterAdminRequest request
    ) {
        return request != null
                && isValidEmail(request.getEmail())
                && !isBlank(request.getPassword())
                && !isBlank(request.getFirstName())
                && !isBlank(request.getLastName())
                && isValidPhoneNumber(request.getPhoneNumber())
                && !isBlank(request.getAdminNumber())
                && !isBlank(request.getDepartment())
                && request.getPassword().length() >= 8;
    }

    private AuthResponse toAuthResponse(
            User user
    ) {
        return new AuthResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                getRole(user),
                jwtService.generateToken(user)
        );
    }

    private String getRole(User user) {
        if (user instanceof Student) {
            return "STUDENT";
        }

        if (user instanceof Staff) {
            return "STAFF";
        }

        if (user instanceof Admin) {
            return "ADMIN";
        }

        throw new IllegalArgumentException(
                "Unsupported PulseUp user type"
        );
    }

    private boolean isValidStudentEmail(String email) {
        return !isBlank(email)
                && email.trim().toLowerCase()
                .matches("^[^\\s@]+@mycput\\.ac\\.za$");
    }

    private boolean isValidEmail(String email) {
        return !isBlank(email)
                && email.trim().toLowerCase()
                .matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    }

    private boolean isValidPhoneNumber(String phoneNumber) {
        return !isBlank(phoneNumber)
                && phoneNumber.trim().matches("0\\d{9}");
    }

    private String normaliseEmail(
            String email
    ) {
        return email
                .trim()
                .toLowerCase();
    }

    private String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private boolean isBlank(
            String value
    ) {
        return value == null ||
                value.trim().isEmpty();
    }
}