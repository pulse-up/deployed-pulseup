package ac.za.cput.pulseup2026.controller;

import ac.za.cput.pulseup2026.domain.Admin;
import ac.za.cput.pulseup2026.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admins")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Admin> getAdminById(
            @PathVariable Long id
    ) {
        Admin admin = adminService.getAdminById(id);

        if (admin == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(admin);
    }

    @GetMapping
    public ResponseEntity<List<Admin>> getAllAdmins() {
        return ResponseEntity.ok(
                adminService.getAllAdmins()
        );
    }

    @PutMapping
    public ResponseEntity<Admin> updateAdmin(
            @RequestBody Admin admin
    ) {
        Admin updatedAdmin = adminService.updateAdmin(admin);

        if (updatedAdmin == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(updatedAdmin);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdmin(
            @PathVariable Long id
    ) {
        boolean deleted = adminService.deleteAdmin(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }
}