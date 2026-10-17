package project.backend.dto;

/** Removes the PIN from an album. Either the current PIN or the account password proves it is the owner. */
public record AlbumLockRemoveRequest(String pin, String password) {
}
