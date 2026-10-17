package project.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import project.backend.domain.EditOp;

/**
 * One step of the edit pipeline. Which fields apply depends on {@code op};
 * everything else is ignored. Validation of ranges happens in PhotoEditService
 * so the error message can name the step.
 */
public record EditStep(
        @NotNull EditOp op,
        Integer x,
        Integer y,
        Integer width,
        Integer height,
        /** ASPECT_CROP: "16:9". */
        @Size(max = 16) String aspectRatio,
        /** ASPECT_CROP: auto | center | face | top | bottom | left | right. */
        @Size(max = 16) String focus,
        /** RESIZE: cover | contain | pad | stretch. */
        @Size(max = 16) String fit,
        /** ROTATE: 90 | 180 | 270. */
        Integer rotation,
        /** FLIP: h | v | hv. */
        @Size(max = 4) String direction,
        /** BLUR, SHARPEN, RADIUS, BORDER, OPACITY, TRIM: strength or size. */
        Integer amount,
        /** RESIZE (pad) and BORDER: hex colour without '#'. */
        @Size(max = 8) String color,
        @Size(max = 500) String prompt,
        @Size(max = 64) String focusObject
) {
}
