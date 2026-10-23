package ac.za.cput.pulseup2026.config;

import ac.za.cput.pulseup2026.repository.AdminRepository;
import ac.za.cput.pulseup2026.request.AuthResponse;
import ac.za.cput.pulseup2026.request.RegisterAdminRequest;
import ac.za.cput.pulseup2026.service.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "pulseup.bootstrap-admin.enabled", havingValue = "true")
public class AdminBootstrap implements ApplicationRunner {

    private final AdminRepository adminRepository;
    private final AuthService authService;
    private final RegisterAdminRequest request;

    public AdminBootstrap(
            AdminRepository adminRepository,
            AuthService authService,
            @Value("${pulseup.bootstrap-admin.email}") String email,
            @Value("${pulseup.bootstrap-admin.password}") String password,
            @Value("${pulseup.bootstrap-admin.first-name}") String firstName,
            @Value("${pulseup.bootstrap-admin.last-name}") String lastName,
            @Value("${pulseup.bootstrap-admin.phone-number}") String phoneNumber,
            @Value("${pulseup.bootstrap-admin.admin-number}") String adminNumber,
            @Value("${pulseup.bootstrap-admin.department}") String department
    ) {
        this.adminRepository = adminRepository;
        this.authService = authService;
        this.request = new RegisterAdminRequest();
        request.setEmail(email);
        request.setPassword(password);
        request.setFirstName(firstName);
        request.setLastName(lastName);
        request.setPhoneNumber(phoneNumber);
        request.setAdminNumber(adminNumber);
        request.setDepartment(department);
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminRepository.count() > 0) {
            return;
        }

        AuthResponse response = authService.registerAdmin(request);
        if (response == null) {
            throw new IllegalStateException("Startup admin bootstrap is enabled but its configuration is invalid");
        }
    }
}
