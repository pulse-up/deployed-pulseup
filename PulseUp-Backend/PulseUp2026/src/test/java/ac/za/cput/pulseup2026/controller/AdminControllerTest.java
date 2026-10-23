package ac.za.cput.pulseup2026.controller;

import ac.za.cput.pulseup2026.domain.Admin;
import ac.za.cput.pulseup2026.service.AdminService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    private static final Long MISSING_ADMIN_ID = 99L;

    @Mock
    private AdminService adminService;

    @InjectMocks
    private AdminController adminController;

    /*
     * T-02: The service represents a missing Admin with null. The controller must
     * translate that service result into HTTP 404 Not Found with no response body.
     */
    @Test
    void shouldReturnNotFoundWhenReadingMissingAdmin() {
        when(adminService.getAdminById(MISSING_ADMIN_ID)).thenReturn(null);

        ResponseEntity<Admin> response =
                adminController.getAdminById(MISSING_ADMIN_ID);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
        verify(adminService).getAdminById(MISSING_ADMIN_ID);
        verifyNoMoreInteractions(adminService);
    }

    /*
     * T-08: A false deletion result means the Admin ID does not exist. The
     * controller must expose that outcome as HTTP 404 Not Found with an empty body.
     */
    @Test
    void shouldReturnNotFoundWhenDeletingMissingAdmin() {
        when(adminService.deleteAdmin(MISSING_ADMIN_ID)).thenReturn(false);

        ResponseEntity<Void> response =
                adminController.deleteAdmin(MISSING_ADMIN_ID);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
        verify(adminService).deleteAdmin(MISSING_ADMIN_ID);
        verifyNoMoreInteractions(adminService);
    }
}
