package ac.za.cput.pulseup2026.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationConverter jwtAuthenticationConverter,
            CorsConfigurationSource corsConfigurationSource
    ) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(
                        corsConfigurationSource
                ))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/health"
                        ).permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/login",
                                "/api/auth/register/student",
                                "/api/auth/student/password-recovery"
                        ).permitAll()

                        // Sick-note workflows
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/sick-notes",
                                "/api/sick-notes/"
                        ).hasRole("STUDENT")
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/sick-notes/me"
                        ).hasRole("STUDENT")
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/sick-notes/staff/me"
                        ).hasRole("STAFF")
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/sick-notes",
                                "/api/sick-notes/"
                        ).hasRole("ADMIN")
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/sick-notes/*/review"
                        ).hasRole("STAFF")

                        // Authenticated student/staff profile image
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/me/profile-image"
                        ).hasAnyRole("STUDENT", "STAFF")
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/me/profile-image"
                        ).hasAnyRole("STUDENT", "STAFF")
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/users/me/profile-image"
                        ).hasAnyRole("STUDENT", "STAFF")

                        // Current-student profile and credentials
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/students/me"
                        ).hasRole("STUDENT")
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/students/me/profile",
                                "/api/students/me/password"
                        ).hasRole("STUDENT")

                        // Cyngatha voucher routes
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/vouchers/me",
                                "/api/vouchers/me/progress"
                        ).hasRole("STUDENT")
                        .requestMatchers(
                                "/api/vouchers/**"
                        ).hasAnyRole("STUDENT", "ADMIN")

                        // Current-staff profile
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/staff/me"
                        ).hasRole("STAFF")

                        // An administrator may create clinic staff only.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/register/staff"
                        ).hasRole("ADMIN")

                        // Admin account management
                        .requestMatchers(
                                "/api/students/**",
                                "/api/staff/**",
                                "/api/admins/**"
                        ).hasRole("ADMIN")

                        // Appointment reads
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/appointments/staff/*"
                        ).hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/appointments/student/*",
                                "/api/appointments/my-queue"
                        ).hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/appointments"
                        ).hasRole("ADMIN")
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/appointments/*"
                        ).hasAnyRole("STUDENT", "STAFF", "ADMIN")

                        // Appointment creation and changes
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/appointments",
                                "/api/appointments/**"
                        ).hasRole("STUDENT")
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/appointments/*/cancel",
                                "/api/appointments/*/reschedule"
                        ).hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/appointments/*/status"
                        ).hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/appointments/**"
                        ).hasRole("ADMIN")

                        // Time slots
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/time-slots/staff/*"
                        ).hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/time-slots",
                                "/api/time-slots/*"
                        ).hasAnyRole("STUDENT", "STAFF", "ADMIN")
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/time-slots",
                                "/api/time-slots/**"
                        ).hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/time-slots/*/availability"
                        ).hasRole("ADMIN")
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/time-slots/**"
                        ).hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/time-slots/**"
                        ).hasRole("ADMIN")
                        .anyRequest().denyAll()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt ->
                        jwt.jwtAuthenticationConverter(
                                jwtAuthenticationConverter
                        )
                ));

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter =
                new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthoritiesClaimName("roles");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter authenticationConverter =
                new JwtAuthenticationConverter();
        authenticationConverter.setJwtGrantedAuthoritiesConverter(
                authoritiesConverter
        );
        return authenticationConverter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
