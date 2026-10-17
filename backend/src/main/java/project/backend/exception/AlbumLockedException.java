package project.backend.exception;

import java.util.UUID;

/** The resource belongs to a PIN-locked album and no valid album token was presented. */
public class AlbumLockedException extends RuntimeException {
    private final UUID albumId;

    public AlbumLockedException(UUID albumId) {
        super("This album is locked. Enter its PIN to continue.");
        this.albumId = albumId;
    }

    public UUID getAlbumId() {
        return albumId;
    }
}
