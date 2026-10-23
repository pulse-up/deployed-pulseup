package ac.za.cput.pulseup2026.util;

import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

public final class JwtClaims {

    private JwtClaims() {
    }

    public static Long getUserId(Jwt jwt) {
        if (jwt == null) {
            return null;
        }

        Object claim = jwt.getClaim("userId");

        if (claim instanceof Number number) {
            return number.longValue();
        }

        if (claim instanceof String value) {
            try {
                return Long.parseLong(value);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }

        return null;
    }

    public static boolean hasRole(Jwt jwt, String role) {
        if (jwt == null || role == null) {
            return false;
        }

        List<String> roles = jwt.getClaimAsStringList("roles");
        return roles != null && roles.stream().anyMatch(role::equalsIgnoreCase);
    }

    public static boolean canActForUser(Jwt jwt, Long requestedUserId) {
        return hasRole(jwt, "ADMIN") ||
                (requestedUserId != null && requestedUserId.equals(getUserId(jwt)));
    }
}
