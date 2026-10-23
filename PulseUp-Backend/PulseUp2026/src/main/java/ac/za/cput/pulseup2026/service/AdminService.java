package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.Admin;
import ac.za.cput.pulseup2026.repository.AdminRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final AdminRepository adminRepository;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    public Admin saveAdmin(Admin admin) {
        if (admin == null) {
            return null;
        }

        return adminRepository.save(admin);
    }

    public Admin getAdminById(Long id) {
        return adminRepository.findById(id).orElse(null);
    }

    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }

    public Admin updateAdmin(Admin admin) {
        if (admin == null || admin.getUserId() == null) {
            return null;
        }

        return adminRepository.save(admin);
    }

    public boolean deleteAdmin(Long id) {
        if (!adminRepository.existsById(id)) {
            return false;
        }

        adminRepository.deleteById(id);
        return true;
    }
}