package ac.za.cput.pulseup2026.request;

public class AuthResponse {

    private final Long userId;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final String role;
    private final String token;
    private final String tokenType;

    public AuthResponse(
            Long userId,
            String firstName,
            String lastName,
            String email,
            String role,
            String token
    ) {
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
        this.token = token;
        this.tokenType = "Bearer";
    }

    public Long getUserId() {
        return userId;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getToken() {
        return token;
    }

    public String getTokenType() {
        return tokenType;
    }
}