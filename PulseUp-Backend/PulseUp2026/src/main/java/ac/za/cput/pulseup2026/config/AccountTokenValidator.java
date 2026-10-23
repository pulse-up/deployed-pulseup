package ac.za.cput.pulseup2026.config;

import ac.za.cput.pulseup2026.domain.User;
import ac.za.cput.pulseup2026.repository.UserRepository;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class AccountTokenValidator
        implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error INVALID_TOKEN =
            new OAuth2Error(
                    "invalid_token",
                    "The token is no longer valid",
                    null
            );

    private final UserRepository userRepository;

    public AccountTokenValidator(
            UserRepository userRepository
    ) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        Long userId = readLongClaim(jwt, "userId");
        Integer tokenVersion = readIntegerClaim(
                jwt,
                "tokenVersion"
        );

        if (userId == null || tokenVersion == null) {
            return failure();
        }

        try {
            User user = userRepository
                    .findById(userId)
                    .orElse(null);

            if (
                    user == null ||
                            !user.isActive() ||
                            user.getTokenVersion() != tokenVersion
            ) {
                return failure();
            }
        } catch (RuntimeException exception) {
            return failure();
        }

        return OAuth2TokenValidatorResult.success();
    }

    private Long readLongClaim(Jwt jwt, String claimName) {
        if (jwt == null) {
            return null;
        }

        Object claim = jwt.getClaim(claimName);

        if (claim instanceof Number number) {
            return number.longValue();
        }

        return null;
    }

    private Integer readIntegerClaim(
            Jwt jwt,
            String claimName
    ) {
        if (jwt == null) {
            return null;
        }

        Object claim = jwt.getClaim(claimName);

        if (claim instanceof Number number) {
            return number.intValue();
        }

        return null;
    }

    private OAuth2TokenValidatorResult failure() {
        return OAuth2TokenValidatorResult.failure(
                INVALID_TOKEN
        );
    }
}
