package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.domain.YearOfStudy;
import ac.za.cput.pulseup2026.factory.StudentFactory;
import ac.za.cput.pulseup2026.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentServicePasswordTest {

    private static final Long STUDENT_ID = 41L;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private StudentService studentService;
    private Student student;

    @BeforeEach
    void setUp() {
        studentService = new StudentService(
                studentRepository,
                passwordEncoder
        );
        student = StudentFactory.createStudent(
                "student@mycput.ac.za",
                "existing-hash",
                "Test",
                "Student",
                "0600000091",
                "230000001",
                "Information Technology",
                "District Six Campus",
                "Private accommodation",
                YearOfStudy.FIRST_YEAR,
                "Test Contact",
                "0600000092"
        );
        ReflectionTestUtils.setField(
                student,
                "userId",
                STUDENT_ID
        );
    }

    @Test
    void shouldChangePasswordAndIncrementTokenVersion() {
        when(studentRepository.findById(STUDENT_ID))
                .thenReturn(Optional.of(student));
        when(passwordEncoder.matches(
                "current-password",
                "existing-hash"
        )).thenReturn(true);
        when(passwordEncoder.matches(
                "different-password",
                "existing-hash"
        )).thenReturn(false);
        when(passwordEncoder.encode("different-password"))
                .thenReturn("new-hash");

        boolean changed = studentService.changePassword(
                STUDENT_ID,
                "current-password",
                "different-password"
        );

        assertTrue(changed);
        assertEquals("new-hash", student.getPasswordHash());
        assertEquals(1, student.getTokenVersion());
        verify(studentRepository).saveAndFlush(student);
    }

    @Test
    void shouldRejectCurrentPasswordReuse() {
        when(studentRepository.findById(STUDENT_ID))
                .thenReturn(Optional.of(student));
        when(passwordEncoder.matches(
                "current-password",
                "existing-hash"
        )).thenReturn(true);
        when(passwordEncoder.matches(
                "current-password",
                "existing-hash"
        )).thenReturn(true);

        boolean changed = studentService.changePassword(
                STUDENT_ID,
                "current-password",
                "current-password"
        );

        assertFalse(changed);
        assertEquals(0, student.getTokenVersion());
        verify(studentRepository, never()).saveAndFlush(student);
    }

    @Test
    void deactivationShouldInvalidateTokensOnlyOnce() {
        student.deactivate();
        student.deactivate();

        assertFalse(student.isActive());
        assertEquals(1, student.getTokenVersion());
    }
}
