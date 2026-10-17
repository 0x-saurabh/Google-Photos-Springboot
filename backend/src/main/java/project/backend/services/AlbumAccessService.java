package project.backend.services;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import project.backend.domain.Album;
import project.backend.domain.User;
import project.backend.exception.AlbumLockedException;
import project.backend.repository.AlbumPhotoRepository;

/**
 * Answers "may this request see a locked album?". The client proves it entered
 * the PIN by sending the album tokens it holds in the {@code X-Album-Token}
 * header (comma-separated, one per unlocked album). Tokens are verified, never
 * stored, so there is no server-side unlock state to leak between sessions.
 */
@Service
public class AlbumAccessService {

    public static final String HEADER = "X-Album-Token";

    private final JwtService jwtService;
    private final AlbumPhotoRepository albumPhotoRepository;

    public AlbumAccessService(JwtService jwtService, AlbumPhotoRepository albumPhotoRepository) {
        this.jwtService = jwtService;
        this.albumPhotoRepository = albumPhotoRepository;
    }

    /** True when the album is not locked, or the current request carries a valid token for it. */
    public boolean isUnlocked(User user, Album album) {
        return !album.isLocked() || unlockedAlbumIds(user).contains(album.getId());
    }

    public void requireUnlocked(User user, Album album) {
        if (!isUnlocked(user, album)) {
            throw new AlbumLockedException(album.getId());
        }
    }

    /**
     * A photo inside any locked album is private: it needs a token for at least
     * one of those albums. Photos outside locked albums are always accessible.
     */
    public void requirePhotoAccessible(User user, UUID photoId) {
        List<Album> lockedAlbums = albumPhotoRepository.findLockedAlbumsByPhotoId(photoId);
        if (lockedAlbums.isEmpty()) return;
        Set<UUID> unlocked = unlockedAlbumIds(user);
        boolean allowed = lockedAlbums.stream().anyMatch(album -> unlocked.contains(album.getId()));
        if (!allowed) {
            throw new AlbumLockedException(lockedAlbums.get(0).getId());
        }
    }

    /** Locked albums containing the photo; used to keep derived copies private too. */
    public List<Album> lockedAlbumsContaining(UUID photoId) {
        return albumPhotoRepository.findLockedAlbumsByPhotoId(photoId);
    }

    private Set<UUID> unlockedAlbumIds(User user) {
        HttpServletRequest request = currentRequest();
        if (request == null) return Set.of();
        String header = request.getHeader(HEADER);
        if (header == null || header.isBlank()) return Set.of();
        return Stream.of(header.split(","))
                .map(String::trim)
                .filter(token -> !token.isEmpty())
                .limit(50)
                .map(token -> jwtService.extractUnlockedAlbumId(token, user.getId()))
                .flatMap(java.util.Optional::stream)
                .collect(Collectors.toSet());
    }

    private HttpServletRequest currentRequest() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            return attributes.getRequest();
        }
        return null;
    }
}
