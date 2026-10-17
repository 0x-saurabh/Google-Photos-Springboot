package project.backend.controllers;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import project.backend.domain.PhotoStatus;
import project.backend.domain.User;
import project.backend.dto.BulkPhotoActionRequest;
import project.backend.dto.CreatePhotoRequest;
import project.backend.dto.PageResponse;
import project.backend.dto.PhotoResponse;
import project.backend.dto.PhotoVersionsResponse;
import project.backend.services.PhotoService;
import project.backend.services.UserService;

@RestController
@RequestMapping("/api")
public class PhotoController {
    private final PhotoService photoService;
    private final UserService userService;

    public PhotoController(PhotoService photoService, UserService userService) {
        this.photoService = photoService;
        this.userService = userService;
    }

    @GetMapping("/photos/{id}")
    public ResponseEntity<PhotoResponse> getPhoto(
            @AuthenticationPrincipal  UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(photoService.getPhoto(user, id));
    }


    @GetMapping("/photos")
    public ResponseEntity<PageResponse<PhotoResponse>> listPhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "ACTIVE") PhotoStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "newest") String sort
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        PageResponse<PhotoResponse> photos = photoService.listPhotos(
                user,
                status,
                q,
                PageRequest.of(page, Math.min(Math.max(size, 1), 100), sortFor(sort))
        );
        return ResponseEntity.ok(photos);
    }

    /** Whitelisted sort orders so the query string can't address arbitrary columns. */
    private static Sort sortFor(String sort) {
        return switch (sort == null ? "newest" : sort.toLowerCase()) {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "name" -> Sort.by(Sort.Direction.ASC, "fileName").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "largest" -> Sort.by(Sort.Direction.DESC, "sizeBytes").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    @GetMapping("/photos/{id}/versions")
    public ResponseEntity<PhotoVersionsResponse> getVersions(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(photoService.getVersions(user, id));
    }

    @PostMapping(value = "/photos/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoResponse> uploadPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestPart("file") MultipartFile file
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        PhotoResponse photo = photoService.uploadPhoto(user, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(photo);
    }

    @PostMapping("/photos")
    public ResponseEntity<PhotoResponse> importPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreatePhotoRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        PhotoResponse photo = photoService.createPhoto(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(photo);
    }

    @PostMapping("/photos/archive")
    public ResponseEntity<Void> archivePhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BulkPhotoActionRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        photoService.archivePhotos(user, request.photoIds());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/photos/trash")
    public ResponseEntity<Void> trashPhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BulkPhotoActionRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        photoService.movePhotosToTrash(user, request.photoIds());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/photos/restore")
    public ResponseEntity<Void> restorePhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BulkPhotoActionRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        photoService.restorePhotos(user, request.photoIds());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/photos/delete-permanent")
    public ResponseEntity<Void> permanentlyDeletePhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BulkPhotoActionRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        photoService.permanentlyDeletePhotos(user, request.photoIds());
        return ResponseEntity.noContent().build();
    }



    @DeleteMapping("/photos/{id}")
    public ResponseEntity<Void> deletePhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        photoService.permanentlyDeletePhoto(user, id);
        return ResponseEntity.noContent().build();
    }


}