package ac.za.cput.pulseup2026.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(
            nullable = false,
            unique = true,
            length = 150
    )
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(length = 20)
    private String phoneNumber;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private int tokenVersion = 0;

    @JsonIgnore
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] profileImageData;

    @JsonIgnore
    @Column(length = 50)
    private String profileImageContentType;

    protected User() {
    }

    protected User(
            String email,
            String passwordHash,
            String firstName,
            String lastName,
            String phoneNumber
    ) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.active = true;
        this.tokenVersion = 0;
    }

    protected void updatePersonalDetails(
            String firstName,
            String lastName,
            String email,
            String phoneNumber
    ) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    @JsonIgnore
    public String getPasswordHash() {
        return passwordHash;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public boolean isActive() {
        return active;
    }

    public int getTokenVersion() {
        return tokenVersion;
    }

    public boolean getHasProfileImage() {
        return profileImageData != null && profileImageData.length > 0;
    }

    @JsonIgnore
    public byte[] getProfileImageData() {
        return profileImageData;
    }

    @JsonIgnore
    public String getProfileImageContentType() {
        return profileImageContentType;
    }

    public void updateProfileImage(
            byte[] imageData,
            String contentType
    ) {
        if (
                imageData == null ||
                        imageData.length == 0 ||
                        contentType == null ||
                        contentType.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Profile image data and content type are required"
            );
        }

        this.profileImageData = imageData.clone();
        this.profileImageContentType = contentType;
    }

    public void removeProfileImage() {
        this.profileImageData = null;
        this.profileImageContentType = null;
    }

    public void changePasswordHash(String encodedHash) {
        if (encodedHash == null || encodedHash.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Encoded password hash cannot be blank"
            );
        }

        this.passwordHash = encodedHash;
        this.tokenVersion++;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        if (this.active) {
            this.active = false;
            this.tokenVersion++;
        }
    }
}
