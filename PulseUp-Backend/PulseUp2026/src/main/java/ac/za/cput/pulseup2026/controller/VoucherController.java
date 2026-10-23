package ac.za.cput.pulseup2026.controller;

import ac.za.cput.pulseup2026.response.FoodVoucherResponse;
import ac.za.cput.pulseup2026.response.VoucherProgressResponse;
import ac.za.cput.pulseup2026.service.FoodVoucherService;
import ac.za.cput.pulseup2026.util.JwtClaims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vouchers")
public class VoucherController {

    private final FoodVoucherService
            foodVoucherService;

    public VoucherController(
            FoodVoucherService foodVoucherService
    ) {
        this.foodVoucherService =
                foodVoucherService;
    }

    @GetMapping("/me/progress")
    public ResponseEntity<VoucherProgressResponse>
    getMyVoucherProgress(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long studentId = JwtClaims.getUserId(jwt);

        if (
                studentId == null ||
                        !JwtClaims.hasRole(jwt, "STUDENT")
        ) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .build();
        }

        VoucherProgressResponse response =
                foodVoucherService.getProgress(
                        studentId
                );

        if (response == null) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<
            List<FoodVoucherResponse>
            > getMyVouchers(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long studentId = JwtClaims.getUserId(jwt);

        if (
                studentId == null ||
                        !JwtClaims.hasRole(jwt, "STUDENT")
        ) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .build();
        }

        return ResponseEntity.ok(
                foodVoucherService
                        .getVouchersForStudent(
                                studentId
                        )
        );
    }

}