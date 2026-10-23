package ac.za.cput.pulseup2026;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@EnabledIfEnvironmentVariable(named = "PULSEUP_DB_PASSWORD", matches = ".+")
class PulseUp2026ApplicationTests {

    @Test
    void contextLoads() {
    }

}
