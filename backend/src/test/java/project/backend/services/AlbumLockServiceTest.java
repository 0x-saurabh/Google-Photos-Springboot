package project.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import project.backend.config.JwtProperties;
import project.backend.domain.Album;
import project.backend.domain.User;
import project.backend.dto.AlbumUnlockResponse;
import project.backend.exception.BadRequestException;
import project.backend.exception.TooManyAttemptsException;
import project.backend.exception.UnauthorizedException;
import project.backend.repository.AlbumRepository;

/** PIN rules, lockout and token scoping, with the repository mocked. */
class AlbumLockServiceTest {

    private final AlbumRepository albumRepository = mock(AlbumRepository.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final JwtService jwtService = new JwtService(
            new JwtProperties("unit-test-secret-that-is-long-enough-0123456789", 900_000, 604_800_000));
    private final AlbumLockService service = new AlbumLockService(albumRepository, encoder, jwtService);

    private User user;
    private Album album;

    @BeforeEach
    void setUp() {
        user = User.builder().id(UUID.randomUUID()).email("a@b.c").passwordHash(encoder.encode("account-pw")).build();
        album = Album.builder().id(UUID.randomUUID()).user(user).title("Private").build();
        when(albumRepository.findByIdAndUserId(album.getId(), user.getId())).thenReturn(Optional.of(album));
        when(albumRepository.save(any(Album.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void lockRequiresFourToSixDigits() {
        assertThrows(BadRequestException.class, () -> service.lock(user, album.getId(), "123"));
        assertThrows(BadRequestException.class, () -> service.lock(user, album.getId(), "12a4"));
        assertThrows(BadRequestException.class, () -> service.lock(user, album.getId(), "1234567"));
        Album locked = service.lock(user, album.getId(), "2468");
        assertTrue(locked.isLocked());
        assertNotNull(locked.getPinHash());
        assertFalse(locked.getPinHash().contains("2468"), "PIN must be stored hashed");
    }

    @Test
    void lockingTwiceIsRejected() {
        service.lock(user, album.getId(), "2468");
        assertThrows(BadRequestException.class, () -> service.lock(user, album.getId(), "1357"));
    }

    @Test
    void unlockIssuesTokenScopedToAlbumAndUser() {
        service.lock(user, album.getId(), "2468");
        AlbumUnlockResponse response = service.unlock(user, album.getId(), "2468");
        assertEquals(Optional.of(album.getId()), jwtService.extractUnlockedAlbumId(response.albumToken(), user.getId()));
        assertEquals(Optional.empty(), jwtService.extractUnlockedAlbumId(response.albumToken(), UUID.randomUUID()));
        assertFalse(jwtService.isTokenValid(response.albumToken()), "album token must not work as an access token");
        assertTrue(response.expiresAt().isAfter(Instant.now().plus(Duration.ofMinutes(5))));
    }

    @Test
    void wrongPinCountsAttemptsThenLocksOut() {
        service.lock(user, album.getId(), "2468");
        for (int i = 1; i < AlbumLockService.MAX_ATTEMPTS; i++) {
            UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                    () -> service.unlock(user, album.getId(), "0000"));
            assertTrue(ex.getMessage().contains("attempt"));
            assertEquals(i, album.getPinFailedAttempts());
        }
        assertThrows(TooManyAttemptsException.class, () -> service.unlock(user, album.getId(), "0000"));
        assertNotNull(album.getPinLockedUntil());
        // Even the right PIN waits for the lockout window.
        assertThrows(TooManyAttemptsException.class, () -> service.unlock(user, album.getId(), "2468"));
    }

    @Test
    void correctPinResetsFailedAttempts() {
        service.lock(user, album.getId(), "2468");
        assertThrows(UnauthorizedException.class, () -> service.unlock(user, album.getId(), "1111"));
        assertEquals(1, album.getPinFailedAttempts());
        service.unlock(user, album.getId(), "2468");
        assertEquals(0, album.getPinFailedAttempts());
    }

    @Test
    void changePinNeedsCurrentPin() {
        service.lock(user, album.getId(), "2468");
        assertThrows(UnauthorizedException.class, () -> service.changePin(user, album.getId(), "9999", "1357"));
        service.changePin(user, album.getId(), "2468", "1357");
        assertThrows(UnauthorizedException.class, () -> service.unlock(user, album.getId(), "2468"));
        service.unlock(user, album.getId(), "1357");
    }

    @Test
    void removeLockAcceptsPinOrAccountPassword() {
        service.lock(user, album.getId(), "2468");
        assertThrows(BadRequestException.class, () -> service.removeLock(user, album.getId(), null, null));
        assertThrows(UnauthorizedException.class, () -> service.removeLock(user, album.getId(), null, "wrong"));
        Album open = service.removeLock(user, album.getId(), null, "account-pw");
        assertFalse(open.isLocked());
        assertNull(open.getPinHash());

        service.lock(user, album.getId(), "2468");
        assertFalse(service.removeLock(user, album.getId(), "2468", null).isLocked());
    }
}
