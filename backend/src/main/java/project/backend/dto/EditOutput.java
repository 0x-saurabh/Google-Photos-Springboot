package project.backend.dto;

import jakarta.validation.constraints.Size;

/** Output encoding for the whole pipeline; appended as the final segment. */
public record EditOutput(
        /** auto | jpg | png | webp | avif. */
        @Size(max = 8) String format,
        /** 1..100. */
        Integer quality
) {
}
