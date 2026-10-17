package project.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import project.backend.domain.Album;
import project.backend.domain.User;
import project.backend.dto.AddPhotosToAlbumRequest;
import project.backend.dto.AlbumLockRemoveRequest;
import project.backend.dto.AlbumLockRequest;
import project.backend.dto.AlbumPinChangeRequest;
import project.backend.dto.AlbumResponse;
import project.backend.dto.AlbumUnlockRequest;
import project.backend.dto.AlbumUnlockResponse;
import project.backend.dto.CreateAlbumRequest;
import project.backend.dto.PageResponse;
import project.backend.dto.PhotoResponse;
import project.backend.dto.UpdateAlbumRequest;
import project.backend.services.AlbumLockService;
import project.backend.services.AlbumService;
import project.backend.services.UserService;

@RestController
@RequestMapping("/api/albums")
public class AlbumController {

    private final AlbumService albumService;
    private final UserService userService;
    private final AlbumLockService albumLockService;

    public AlbumController(AlbumService albumService, UserService userService, AlbumLockService albumLockService) {
        this.albumService = albumService;
        this.userService = userService;
        this.albumLockService = albumLockService;
    }

    @GetMapping
    public ResponseEntity<List<AlbumResponse>> listAlbums(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(albumService.listAlbums(user));
    }

    @PostMapping
    public ResponseEntity<AlbumResponse> createAlbum(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateAlbumRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        AlbumResponse album = albumService.createAlbum(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(album);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlbumResponse> getAlbum(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(albumService.getAlbum(user, id));
    }

    @GetMapping("/{id}/photos")
    public ResponseEntity<PageResponse<PhotoResponse>> getAlbumPhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        PageResponse<PhotoResponse> photos = albumService.getAlbumPhotos(
                user,
                id,
                PageRequest.of(page, size)
        );
        return ResponseEntity.ok(photos);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AlbumResponse> updateAlbum(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAlbumRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(albumService.updateAlbum(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlbum(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        albumService.deleteAlbum(user, id);
        return ResponseEntity.noContent().build();
    }

    /** Protects the album with a PIN. Photos inside disappear from the library until unlocked. */
    @PostMapping("/{id}/lock")
    public ResponseEntity<AlbumResponse> lockAlbum(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody AlbumLockRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        Album album = albumLockService.lock(user, id, request.pin());
        return ResponseEntity.ok(albumService.getAlbum(user, album.getId()));
    }

    @PatchMapping("/{id}/lock")
    public ResponseEntity<Void> changeAlbumPin(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody AlbumPinChangeRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        albumLockService.changePin(user, id, request.currentPin(), request.newPin());
        return ResponseEntity.noContent().build();
    }

    /** POST rather than DELETE because the proof (PIN or password) travels in the body. */
    @PostMapping("/{id}/lock/remove")
    public ResponseEntity<AlbumResponse> removeAlbumLock(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody AlbumLockRemoveRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        Album album = albumLockService.removeLock(user, id, request.pin(), request.password());
        return ResponseEntity.ok(albumService.getAlbum(user, album.getId()));
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<AlbumUnlockResponse> unlockAlbum(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody AlbumUnlockRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(albumLockService.unlock(user, id, request.pin()));
    }

    @PostMapping("/{id}/photos")
    public ResponseEntity<Void> addPhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody AddPhotosToAlbumRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        albumService.addPhotosToAlbum(user, id, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    public ResponseEntity<Void> removePhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @PathVariable UUID photoId
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        albumService.removePhotoFromAlbum(user, id, photoId);
        return ResponseEntity.noContent().build();
    }
}