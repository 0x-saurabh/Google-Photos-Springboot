package project.backend.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ImportPhotosRequest(
        @NotEmpty List<String> imagekitFileIds
) {
}
