package ac.za.cput.pulseup2026.controller;

import ac.za.cput.pulseup2026.domain.User;
import ac.za.cput.pulseup2026.response.ProfileImageResponse;
import ac.za.cput.pulseup2026.service.UserProfileImageService;
import ac.za.cput.pulseup2026.util.JwtClaims;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/me/profile-image")
public class UserProfileImageController {

    private final UserProfileImageService profileImageService;

    public UserProfileImageController(
            UserProfileImageService profileImageService
    ) {
        this.profileImageService = profileImageService;
    }

    @GetMapping
    public ResponseEntity<byte[]> getProfileImage(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = JwtClaims.getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = profileImageService.getUserWithProfileImage(userId);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(
                        user.getProfileImageContentType()
                ))
                .body(user.getProfileImageData());
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileImageResponse> updateProfileImage(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("image") MultipartFile image
    ) {
        Long userId = JwtClaims.getUserId(jwt);
        if (!profileImageService.updateProfileImage(userId, image)) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(new ProfileImageResponse(true));
    }

    @DeleteMapping
    public ResponseEntity<Void> removeProfileImage(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = JwtClaims.getUserId(jwt);
        if (!profileImageService.removeProfileImage(userId)) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.noContent().build();
    }
}
