package project.backend.domain;

/**
 * Operations the edit pipeline accepts. Each maps to one ImageKit URL
 * transformation segment; AI operations consume ImageKit AI credits.
 */
public enum EditOp {
    CROP,
    ASPECT_CROP,
    RESIZE,
    ROTATE,
    FLIP,
    GRAYSCALE,
    BLUR,
    SHARPEN,
    CONTRAST,
    RADIUS,
    ROUND,
    BORDER,
    OPACITY,
    TRIM,
    REMOVE_BACKGROUND,
    BACKGROUND_AND_SHADOW,
    CHANGE_BACKGROUND,
    GENERATIVE_FILL,
    SMART_CROP,
    OBJECT_CROP,
    RETOUCH,
    UPSCALE,
    AI_EDIT;

    public boolean isAi() {
        return switch (this) {
            case REMOVE_BACKGROUND, BACKGROUND_AND_SHADOW, CHANGE_BACKGROUND, GENERATIVE_FILL,
                 SMART_CROP, OBJECT_CROP, RETOUCH, UPSCALE, AI_EDIT -> true;
            default -> false;
        };
    }

    /** The AI transform type recorded on a derived photo, when this op is an AI op. */
    public AiTransformType aiType() {
        return isAi() ? AiTransformType.valueOf(name()) : null;
    }
}
