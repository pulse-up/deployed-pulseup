package ac.za.cput.pulseup2026.config;

import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.domain.YearOfStudy;
import ac.za.cput.pulseup2026.factory.StudentFactory;
import ac.za.cput.pulseup2026.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountTokenValidatorTest {

    private static final Long USER_ID = 73L;

    @Mock
    private UserRepository userRepository;

    private AccountTokenValidator validator;
    private Student student;

    @BeforeEach
    void setUp() {
        validator = new AccountTokenValidator(userRepository);
        student = StudentFactory.createStudent(
                "validator@mycput.ac.za",
                "encoded-password",
                "Token",
                "Student",
                "0600000081",
                "230000002",
                "Information Technology",
                "District Six Campus",
                "Private accommodation",
                YearOfStudy.SECOND_YEAR,
                "Token Contact",
                "0600000082"
        );
        ReflectionTestUtils.setField(student, "userId", USER_ID);
    }

    @Test
    void shouldAcceptActiveUserWithMatchingTokenVersion() {
        when(userRepository.findById(USER_ID))
                .thenReturn(Optional.of(student));

        OAuth2TokenValidatorResult result = validator.validate(
                token(USER_ID, 0)
        );

        assertFalse(result.hasErrors());
    }

    @Test
    void shouldRejectStaleTokenVersion() {
        student.changePasswordHash("new-encoded-password");
        when(userRepository.findById(USER_ID))
                .thenReturn(Optional.of(student));

        OAuth2TokenValidatorResult result = validator.validate(
                token(USER_ID, 0)
        );

        assertTrue(result.hasErrors());
    }

    @Test
    void shouldRejectInactiveUser() {
        student.deactivate();
        when(userRepository.findById(USER_ID))
                .thenReturn(Optional.of(student));

        OAuth2TokenValidatorResult result = validator.validate(
                token(USER_ID, student.getTokenVersion())
        );

        assertTrue(result.hasErrors());
    }

    @Test
    void shouldRejectMissingAccountClaims() {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "HS256")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        assertTrue(validator.validate(jwt).hasErrors());
    }

    private Jwt token(Long userId, int tokenVersion) {
        Instant now = Instant.now();
        return Jwt.withTokenValue("test-token")
                .header("alg", "HS256")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(60))
                .claim("userId", userId)
                .claim("tokenVersion", tokenVersion)
                .build();
    }
}
