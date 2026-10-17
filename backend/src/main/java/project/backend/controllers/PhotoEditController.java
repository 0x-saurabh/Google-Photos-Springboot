package project.backend.controllers;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import project.backend.domain.User;
import project.backend.dto.EditPreviewResponse;
import project.backend.dto.EditRequest;
import project.backend.dto.PhotoResponse;
import project.backend.services.PhotoEditService;
import project.backend.services.UserService;

/** Non-destructive edit pipeline: ordered steps rendered through ImageKit. */
@RestController
@RequestMapping("/api/photos/{photoId}/edits")
public class PhotoEditController {

    private final PhotoEditService photoEditService;
    private final UserService userService;

    public PhotoEditController(PhotoEditService photoEditService, UserService userService) {
        this.photoEditService = photoEditService;
        this.userService = userService;
    }

    @PostMapping("/preview")
    public ResponseEntity<EditPreviewResponse> preview(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID photoId,
            @Valid @RequestBody EditRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(photoEditService.preview(user, photoId, request));
    }

    @PostMapping("/apply")
    public ResponseEntity<PhotoResponse> apply(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID photoId,
            @Valid @RequestBody EditRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(photoEditService.apply(user, photoId, request));
    }
}
