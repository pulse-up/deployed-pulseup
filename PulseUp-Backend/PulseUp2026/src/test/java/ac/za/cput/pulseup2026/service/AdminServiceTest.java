package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.Admin;
import ac.za.cput.pulseup2026.factory.AdminFactory;
import ac.za.cput.pulseup2026.repository.AdminRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    private static final Long ADMIN_ID = 1L;

    @Mock
    private AdminRepository adminRepository;

    @InjectMocks
    private AdminService adminService;

    /*
     * T-01: A valid Admin created through the domain factory must be passed to
     * AdminRepository. Returning the saved object verifies the service delegates
     * persistence of the joined users/admins records to JPA without replacing it.
     */
    @Test
    void shouldSaveValidAdmin() {
        Admin admin = createAdmin("Information Technology");
        assertNotNull(admin);
        when(adminRepository.save(admin)).thenReturn(admin);

        Admin result = adminService.saveAdmin(admin);

        assertNotNull(result);
        assertSame(admin, result);
        verify(adminRepository).save(admin);
        verifyNoMoreInteractions(adminRepository);
    }

    /*
     * T-02: When the repository cannot find the requested Admin ID, the service
     * contract converts Optional.empty() to null so the controller can return 404.
     */
    @Test
    void shouldReturnNullWhenAdminIdDoesNotExist() {
        when(adminRepository.findById(ADMIN_ID)).thenReturn(Optional.empty());

        Admin result = adminService.getAdminById(ADMIN_ID);

        assertNull(result);
        verify(adminRepository).findById(ADMIN_ID);
        verifyNoMoreInteractions(adminRepository);
    }

    /*
     * T-03: Admin updates use the complete entity supplied to the service. Giving
     * that entity a generated-style ID and a changed department verifies that the
     * changed record is saved and returned without implying a fetch-and-patch flow.
     */
    @Test
    void shouldSaveAdminWithUpdatedDepartment() {
        Admin updatedAdmin = createAdmin("Student Wellness");
        assertNotNull(updatedAdmin);
        ReflectionTestUtils.setField(updatedAdmin, "userId", ADMIN_ID);
        when(adminRepository.save(updatedAdmin)).thenReturn(updatedAdmin);

        Admin result = adminService.updateAdmin(updatedAdmin);

        assertNotNull(result);
        assertSame(updatedAdmin, result);
        assertEquals("Student Wellness", result.getDepartment());
        verify(adminRepository).save(updatedAdmin);
        verifyNoMoreInteractions(adminRepository);
    }

    /*
     * T-08: Deleting an unknown Admin first checks existence. A false result must
     * be returned and deleteById must not run, allowing the controller to return 404.
     */
    @Test
    void shouldNotDeleteAdminWhenIdDoesNotExist() {
        when(adminRepository.existsById(ADMIN_ID)).thenReturn(false);

        boolean result = adminService.deleteAdmin(ADMIN_ID);

        assertFalse(result);
        verify(adminRepository).existsById(ADMIN_ID);
        verify(adminRepository, never()).deleteById(ADMIN_ID);
        verifyNoMoreInteractions(adminRepository);
    }

    private Admin createAdmin(String department) {
        return AdminFactory.createAdmin(
                "admin@pulseup.co.za",
                "encoded-password",
                "Amina",
                "Daniels",
                "0215550100",
                "ADM-001",
                department
        );
    }
}
