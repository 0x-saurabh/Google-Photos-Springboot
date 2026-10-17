package project.backend.dto;

public record EditPreviewResponse(
        String previewUrl,
        /** Same rendition with ImageKit's attachment flag so browsers download it. */
        String downloadUrl,
        String transformChain,
        boolean usesAi
) {
}
