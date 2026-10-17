package project.backend.services;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import project.backend.domain.Album;
import project.backend.domain.User;
import project.backend.dto.AlbumUnlockResponse;
import project.backend.exception.BadRequestException;
import project.backend.exception.ResourceNotFoundException;
import project.backend.exception.TooManyAttemptsException;
import project.backend.exception.UnauthorizedException;
import project.backend.repository.AlbumRepository;

/**
 * PIN protection for albums. PINs are stored as BCrypt hashes like passwords.
 * After {@value #MAX_ATTEMPTS} wrong PINs in a row the album refuses PIN entry
 * for {@link #LOCKOUT}; the counter is persisted so a page reload does not reset it.
 *
 * <p>Methods here deliberately run without a class-level transaction: a failed
 * attempt must be written even though the call ends in an exception.
 */
@Service
public class AlbumLockService {

    static final int MAX_ATTEMPTS = 5;
    static final Duration LOCKOUT = Duration.ofMinutes(5);
    static final Duration UNLOCK_TTL = Duration.ofMinutes(10);
    private static final Pattern PIN_PATTERN = Pattern.compile("^\\d{4,6}$");

    private final AlbumRepository albumRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AlbumLockService(
            AlbumRepository albumRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.albumRepository = albumRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /** Makes the album private. The caller is the owner and already authenticated, so only a new PIN is needed. */
    public Album lock(User user, UUID albumId, String pin) {
        Album album = getOwnedAlbum(user, albumId);
        if (album.isLocked()) {
            throw new BadRequestException("This album already has a PIN. Change it instead.");
        }
        album.setPinHash(passwordEncoder.encode(validatePin(pin)));
        album.setLocked(true);
        album.setPinFailedAttempts(0);
        album.setPinLockedUntil(null);
        return albumRepository.save(album);
    }

    public Album changePin(User user, UUID albumId, String currentPin, String newPin) {
        Album album = getLockedAlbum(user, albumId);
        String validated = validatePin(newPin);
        verifyPin(album, currentPin);
        album.setPinHash(passwordEncoder.encode(validated));
        return albumRepository.save(album);
    }

    /**
     * Removes the PIN. The current PIN is the normal route; the account password
     * is the recovery route for a forgotten PIN.
     */
    public Album removeLock(User user, UUID albumId, String pin, String password) {
        Album album = getLockedAlbum(user, albumId);
        if (pin != null && !pin.isBlank()) {
            verifyPin(album, pin);
        } else if (password != null && !password.isEmpty()) {
            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                throw new UnauthorizedException("Incorrect account password");
            }
        } else {
            throw new BadRequestException("Enter the album PIN or your account password");
        }
        album.setLocked(false);
        album.setPinHash(null);
        album.setPinFailedAttempts(0);
        album.setPinLockedUntil(null);
        return albumRepository.save(album);
    }

    /** Checks the PIN and hands back a token the client attaches to later requests. */
    public AlbumUnlockResponse unlock(User user, UUID albumId, String pin) {
        Album album = getLockedAlbum(user, albumId);
        verifyPin(album, pin);
        Instant expiresAt = Instant.now().plus(UNLOCK_TTL);
        String token = jwtService.generateAlbumToken(user, album.getId(), UNLOCK_TTL);
        return new AlbumUnlockResponse(token, expiresAt);
    }

    /** Throws unless {@code pin} matches; records failures and enforces the lockout window. */
    void verifyPin(Album album, String pin) {
        Instant now = Instant.now();
        if (album.getPinLockedUntil() != null && album.getPinLockedUntil().isAfter(now)) {
            long minutes = Math.max(1, Duration.between(now, album.getPinLockedUntil()).toMinutes() + 1);
            throw new TooManyAttemptsException(
                    "Too many wrong PINs. Try again in " + minutes + (minutes == 1 ? " minute." : " minutes."));
        }

        boolean matches = pin != null && album.getPinHash() != null && passwordEncoder.matches(pin, album.getPinHash());
        if (!matches) {
            int attempts = album.getPinFailedAttempts() + 1;
            if (attempts >= MAX_ATTEMPTS) {
                album.setPinFailedAttempts(0);
                album.setPinLockedUntil(now.plus(LOCKOUT));
                albumRepository.save(album);
                throw new TooManyAttemptsException(
                        "Too many wrong PINs. Try again in " + LOCKOUT.toMinutes() + " minutes.");
            }
            album.setPinFailedAttempts(attempts);
            albumRepository.save(album);
            int remaining = MAX_ATTEMPTS - attempts;
            throw new UnauthorizedException(
                    "Incorrect PIN. " + remaining + (remaining == 1 ? " attempt left." : " attempts left."));
        }

        if (album.getPinFailedAttempts() != 0 || album.getPinLockedUntil() != null) {
            album.setPinFailedAttempts(0);
            album.setPinLockedUntil(null);
            albumRepository.save(album);
        }
    }

    static String validatePin(String pin) {
        if (pin == null || !PIN_PATTERN.matcher(pin).matches()) {
            throw new BadRequestException("The PIN must be 4 to 6 digits");
        }
        return pin;
    }

    private Album getLockedAlbum(User user, UUID albumId) {
        Album album = getOwnedAlbum(user, albumId);
        if (!album.isLocked()) {
            throw new BadRequestException("This album is not locked");
        }
        return album;
    }

    private Album getOwnedAlbum(User user, UUID albumId) {
        return albumRepository.findByIdAndUserId(albumId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Album not found"));
    }
}
