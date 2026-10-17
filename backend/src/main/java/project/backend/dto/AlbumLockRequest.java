package project.backend.dto;

/** Turns an album private by protecting it with a PIN. */
public record AlbumLockRequest(String pin) {
}
