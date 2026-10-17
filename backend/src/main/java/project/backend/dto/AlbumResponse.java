package project.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record AlbumResponse(
        UUID id,
        String title,
        UUID coverPhotoId,
        String coverThumbnailUrl,
        long photoCount,
        /** The album is protected by a PIN. */
        boolean locked,
        /** The caller presented a valid album token for this request, so contents are visible. */
        boolean unlocked,
        Instant createdAt,
        Instant updatedAt
) {
}