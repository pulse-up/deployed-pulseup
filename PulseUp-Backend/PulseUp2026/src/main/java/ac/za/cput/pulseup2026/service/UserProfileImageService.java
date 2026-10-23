package ac.za.cput.pulseup2026.service;

import ac.za.cput.pulseup2026.domain.User;
import ac.za.cput.pulseup2026.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class UserProfileImageService {

    private static final long MAX_UPLOAD_BYTES = 5L * 1024L * 1024L;
    private static final int OUTPUT_SIZE = 512;
    private static final int MAX_SOURCE_DIMENSION = 8000;
    private static final Set<String> ACCEPTED_TYPES =
            Set.of("image/jpeg", "image/png");

    private final UserRepository userRepository;

    public UserProfileImageService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public boolean updateProfileImage(
            Long userId,
            MultipartFile image
    ) {
        if (
                userId == null ||
                        image == null ||
                        image.isEmpty() ||
                        image.getSize() > MAX_UPLOAD_BYTES ||
                        !ACCEPTED_TYPES.contains(image.getContentType())
        ) {
            return false;
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !user.isActive()) {
            return false;
        }

        byte[] sanitizedImage;
        try {
            sanitizedImage = sanitizeAndResize(image.getBytes());
        } catch (IOException exception) {
            return false;
        }

        if (sanitizedImage == null) {
            return false;
        }

        user.updateProfileImage(sanitizedImage, "image/jpeg");
        userRepository.save(user);
        return true;
    }

    public User getUserWithProfileImage(Long userId) {
        if (userId == null) {
            return null;
        }

        User user = userRepository.findById(userId).orElse(null);
        return user != null && user.isActive() && user.getHasProfileImage()
                ? user
                : null;
    }

    @Transactional
    public boolean removeProfileImage(Long userId) {
        if (userId == null) {
            return false;
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !user.isActive()) {
            return false;
        }

        user.removeProfileImage();
        userRepository.save(user);
        return true;
    }

    private byte[] sanitizeAndResize(byte[] sourceBytes) throws IOException {
        BufferedImage source = ImageIO.read(
                new ByteArrayInputStream(sourceBytes)
        );

        if (
                source == null ||
                        source.getWidth() < 1 ||
                        source.getHeight() < 1 ||
                        source.getWidth() > MAX_SOURCE_DIMENSION ||
                        source.getHeight() > MAX_SOURCE_DIMENSION
        ) {
            return null;
        }

        int cropSize = Math.min(source.getWidth(), source.getHeight());
        int cropX = (source.getWidth() - cropSize) / 2;
        int cropY = (source.getHeight() - cropSize) / 2;
        BufferedImage output = new BufferedImage(
                OUTPUT_SIZE,
                OUTPUT_SIZE,
                BufferedImage.TYPE_INT_RGB
        );
        Graphics2D graphics = output.createGraphics();

        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
            graphics.setRenderingHint(
                    RenderingHints.KEY_INTERPOLATION,
                    RenderingHints.VALUE_INTERPOLATION_BICUBIC
            );
            graphics.setRenderingHint(
                    RenderingHints.KEY_RENDERING,
                    RenderingHints.VALUE_RENDER_QUALITY
            );
            graphics.drawImage(
                    source,
                    0,
                    0,
                    OUTPUT_SIZE,
                    OUTPUT_SIZE,
                    cropX,
                    cropY,
                    cropX + cropSize,
                    cropY + cropSize,
                    null
            );
        } finally {
            graphics.dispose();
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        if (!ImageIO.write(output, "jpg", outputStream)) {
            return null;
        }

        return outputStream.toByteArray();
    }
}
