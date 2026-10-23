package ac.za.cput.pulseup2026.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        try {
            Integer result = jdbcTemplate.queryForObject(
                    "SELECT 1",
                    Integer.class
            );
            if (result != null && result == 1) {
                return ResponseEntity.ok(Map.of("status", "UP"));
            }
        } catch (RuntimeException exception) {
            // Do not expose database or infrastructure details publicly.
        }

        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("status", "DOWN"));
    }
}
