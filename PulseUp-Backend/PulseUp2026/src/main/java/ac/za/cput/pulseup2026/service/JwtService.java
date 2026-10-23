package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.Admin;
import ac.za.cput.pulseup2026.domain.Staff;
import ac.za.cput.pulseup2026.domain.Student;
import ac.za.cput.pulseup2026.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final long expirationSeconds;

    public JwtService(
            JwtEncoder jwtEncoder,
            @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.expiration-seconds}") long expirationSeconds
    ) {
        this.jwtEncoder = jwtEncoder;
        this.issuer = issuer;
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        Instant issuedAt = Instant.now();
        Instant expiresAt =
                issuedAt.plusSeconds(expirationSeconds);

        String role = getRole(user);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .subject(user.getEmail())
                .claim("userId", user.getUserId())
                .claim("tokenVersion", user.getTokenVersion())
                .claim("roles", List.of(role))
                .build();

        return jwtEncoder
                .encode(JwtEncoderParameters.from(claims))
                .getTokenValue();
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
                "Unsupported user type: "
                        + user.getClass().getSimpleName()
        );
    }
}