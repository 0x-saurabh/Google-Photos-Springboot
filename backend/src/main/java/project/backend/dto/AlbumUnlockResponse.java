package project.backend.dto;

import java.time.Instant;

/** Short-lived token the client sends back in the X-Album-Token header. */
public record AlbumUnlockResponse(String albumToken, Instant expiresAt) {
}
