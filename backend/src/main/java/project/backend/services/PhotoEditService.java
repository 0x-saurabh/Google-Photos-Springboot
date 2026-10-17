package project.backend.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import project.backend.domain.AiTransformType;
import project.backend.domain.EditOp;
import project.backend.domain.Photo;
import project.backend.domain.User;
import project.backend.dto.AiTransformRequest;
import project.backend.dto.EditOutput;
import project.backend.dto.EditPreviewResponse;
import project.backend.dto.EditRequest;
import project.backend.dto.EditStep;
import project.backend.dto.PhotoResponse;
import project.backend.exception.BadRequestException;
import project.backend.exception.ResourceNotFoundException;
import project.backend.repository.PhotoRepository;

/**
 * Builds ImageKit chained transformations from an ordered list of edit steps.
 * Previews only produce a URL; applying downloads the rendition and stores it
 * as a new photo so the source is never modified.
 */
@Service
public class PhotoEditService {
    static final int MIN_DIMENSION = 1;
    static final int MAX_DIMENSION = 4096;

    private static final Pattern HEX_COLOR = Pattern.compile("^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$");
    private static final Pattern ASPECT_RATIO = Pattern.compile("^(\\d{1,4}):(\\d{1,4})$");
    private static final Set<String> FOCUS_VALUES = Set.of("auto", "center", "face", "top", "bottom", "left", "right",
            "top_left", "top_right", "bottom_left", "bottom_right");
    private static final Set<String> FIT_VALUES = Set.of("cover", "contain", "pad", "stretch");
    private static final Set<String> FORMAT_VALUES = Set.of("auto", "jpg", "png", "webp", "avif");

    private final PhotoRepository photoRepository;
    private final ImageKitService imageKitService;
    private final PhotoService photoService;
    private final AiTransformService aiTransformService;

    public PhotoEditService(
            PhotoRepository photoRepository,
            ImageKitService imageKitService,
            PhotoService photoService,
            AiTransformService aiTransformService
    ) {
        this.photoRepository = photoRepository;
        this.imageKitService = imageKitService;
        this.photoService = photoService;
        this.aiTransformService = aiTransformService;
    }

    public EditPreviewResponse preview(User user, UUID photoId, EditRequest request) {
        Photo photo = getOwnedPhoto(user, photoId);
        String chain = buildChain(request, photo);
        String previewUrl = imageKitService.buildAiTransformUrl(photo.getUrl(), chain);
        String downloadUrl = previewUrl + (previewUrl.contains("?") ? "&" : "?") + "ik-attachment=true";
        return new EditPreviewResponse(previewUrl, downloadUrl, chain, usesAi(request));
    }

    public PhotoResponse apply(User user, UUID photoId, EditRequest request) {
        Photo photo = getOwnedPhoto(user, photoId);
        String chain = buildChain(request, photo);
        if (chain.isBlank()) {
            throw new BadRequestException("Add at least one edit before saving");
        }

        String transformUrl = imageKitService.buildAiTransformUrl(photo.getUrl(), chain);
        byte[] bytes = imageKitService.downloadTransformedImage(transformUrl);

        String fileName = buildDerivedFileName(photo.getFileName(), outputFormat(request));
        var uploadResponse = imageKitService.uploadBytes(user, bytes, fileName);

        return photoService.createDerivedPhoto(user, photo, uploadResponse, firstAiType(request), chain);
    }

    /** Joins every validated step (and the output segment) with ImageKit's ':' chain separator. */
    String buildChain(EditRequest request, Photo photo) {
        List<String> segments = new ArrayList<>();
        List<EditStep> steps = request.steps() == null ? List.of() : request.steps();

        for (int i = 0; i < steps.size(); i++) {
            EditStep step = steps.get(i);
            if (step == null || step.op() == null) {
                throw new BadRequestException("Step " + (i + 1) + " is missing an operation");
            }
            segments.add(buildSegment(step, i + 1, photo));
        }

        String output = buildOutputSegment(request.output());
        if (output != null) {
            segments.add(output);
        }
        return String.join(":", segments);
    }

    private String buildSegment(EditStep step, int position, Photo photo) {
        String label = "Step " + position + " (" + step.op().name().toLowerCase(Locale.ROOT).replace('_', ' ') + ")";

        return switch (step.op()) {
            case CROP -> {
                int width = requireRange(step.width(), "width", MIN_DIMENSION, MAX_DIMENSION, label);
                int height = requireRange(step.height(), "height", MIN_DIMENSION, MAX_DIMENSION, label);
                int x = requireRange(step.x(), "x", 0, MAX_DIMENSION, label);
                int y = requireRange(step.y(), "y", 0, MAX_DIMENSION, label);
                if (photo.getWidth() != null && x + width > photo.getWidth()) {
                    throw new BadRequestException(label + ": the crop extends past the right edge of the image");
                }
                if (photo.getHeight() != null && y + height > photo.getHeight()) {
                    throw new BadRequestException(label + ": the crop extends past the bottom edge of the image");
                }
                yield "cm-extract,w-" + width + ",h-" + height + ",x-" + x + ",y-" + y;
            }
            case ASPECT_CROP -> {
                var matcher = ASPECT_RATIO.matcher(step.aspectRatio() == null ? "" : step.aspectRatio().trim());
                if (!matcher.matches()) {
                    throw new BadRequestException(label + ": aspect ratio must look like 16:9");
                }
                int ratioW = Integer.parseInt(matcher.group(1));
                int ratioH = Integer.parseInt(matcher.group(2));
                if (ratioW == 0 || ratioH == 0) {
                    throw new BadRequestException(label + ": aspect ratio sides must be greater than zero");
                }
                String focus = optionalChoice(step.focus(), FOCUS_VALUES, "auto", "focus", label);

                // Largest box of that ratio that fits inside the original, so nothing is upscaled.
                if (photo.getWidth() != null && photo.getHeight() != null && photo.getWidth() > 0 && photo.getHeight() > 0) {
                    double target = (double) ratioW / ratioH;
                    double original = (double) photo.getWidth() / photo.getHeight();
                    int width;
                    int height;
                    if (target >= original) {
                        width = photo.getWidth();
                        height = Math.max(1, (int) Math.round(width / target));
                    } else {
                        height = photo.getHeight();
                        width = Math.max(1, (int) Math.round(height * target));
                    }
                    yield "w-" + Math.min(width, MAX_DIMENSION) + ",h-" + Math.min(height, MAX_DIMENSION) + ",fo-" + focus;
                }
                yield "ar-" + ratioW + "-" + ratioH + ",fo-" + focus;
            }
            case RESIZE -> {
                boolean hasWidth = step.width() != null;
                boolean hasHeight = step.height() != null;
                if (!hasWidth && !hasHeight) {
                    throw new BadRequestException(label + ": give a width, a height, or both");
                }
                StringBuilder segment = new StringBuilder();
                if (hasWidth) {
                    segment.append("w-").append(requireRange(step.width(), "width", MIN_DIMENSION, MAX_DIMENSION, label));
                }
                if (hasHeight) {
                    if (!segment.isEmpty()) segment.append(',');
                    segment.append("h-").append(requireRange(step.height(), "height", MIN_DIMENSION, MAX_DIMENSION, label));
                }
                String fit = optionalChoice(step.fit(), FIT_VALUES, "cover", "fit", label);
                switch (fit) {
                    case "contain" -> segment.append(",c-at_max");
                    case "stretch" -> segment.append(",c-force");
                    case "pad" -> {
                        segment.append(",cm-pad_resize");
                        if (step.color() != null && !step.color().isBlank()) {
                            segment.append(",bg-").append(requireHexColor(step.color(), label));
                        }
                    }
                    default -> {
                        // "cover": ImageKit's default maintain_ratio crop.
                        if (hasWidth && hasHeight) {
                            segment.append(",fo-").append(optionalChoice(step.focus(), FOCUS_VALUES, "auto", "focus", label));
                        }
                    }
                }
                yield segment.toString();
            }
            case ROTATE -> {
                Integer rotation = step.rotation();
                if (rotation == null || (rotation != 90 && rotation != 180 && rotation != 270)) {
                    throw new BadRequestException(label + ": rotation must be 90, 180 or 270 degrees");
                }
                yield "rt-" + rotation;
            }
            case FLIP -> {
                String direction = step.direction() == null ? "" : step.direction().trim().toLowerCase(Locale.ROOT);
                yield switch (direction) {
                    case "h" -> "fl-h";
                    case "v" -> "fl-v";
                    case "hv", "h_v" -> "fl-h_v";
                    default -> throw new BadRequestException(label + ": direction must be h, v or hv");
                };
            }
            case GRAYSCALE -> "e-grayscale";
            case BLUR -> "bl-" + requireRange(step.amount(), "amount", 1, 100, label);
            case SHARPEN -> "e-sharpen-" + requireRange(step.amount(), "amount", 1, 10, label);
            case CONTRAST -> "e-contrast";
            case RADIUS -> "r-" + requireRange(step.amount(), "amount", 1, 1000, label);
            case ROUND -> "r-max";
            case BORDER -> {
                int size = requireRange(step.amount(), "amount", 1, 200, label);
                String color = step.color() == null || step.color().isBlank() ? "000000" : requireHexColor(step.color(), label);
                yield "b-" + size + "_" + color;
            }
            case OPACITY -> "o-" + requireRange(step.amount(), "amount", 0, 100, label);
            case TRIM -> step.amount() == null ? "t-true" : "t-" + requireRange(step.amount(), "amount", 1, 99, label);
            case REMOVE_BACKGROUND, BACKGROUND_AND_SHADOW, CHANGE_BACKGROUND, GENERATIVE_FILL,
                 SMART_CROP, OBJECT_CROP, RETOUCH, UPSCALE, AI_EDIT -> {
                AiTransformRequest aiRequest = new AiTransformRequest(
                        AiTransformType.valueOf(step.op().name()),
                        step.prompt(),
                        step.width(),
                        step.height(),
                        step.focusObject()
                );
                yield aiTransformService.buildTransformChain(aiRequest, photo);
            }
        };
    }

    private String buildOutputSegment(EditOutput output) {
        if (output == null) return null;
        List<String> parts = new ArrayList<>();
        if (output.format() != null && !output.format().isBlank()) {
            String format = output.format().trim().toLowerCase(Locale.ROOT);
            if (!FORMAT_VALUES.contains(format)) {
                throw new BadRequestException("Output format must be auto, jpg, png, webp or avif");
            }
            if (!format.equals("auto")) {
                parts.add("f-" + format);
            }
        }
        if (output.quality() != null) {
            parts.add("q-" + requireRange(output.quality(), "quality", 1, 100, "Output"));
        }
        return parts.isEmpty() ? null : String.join(",", parts);
    }

    private boolean usesAi(EditRequest request) {
        return request.steps() != null && request.steps().stream().anyMatch(step -> step != null && step.op() != null && step.op().isAi());
    }

    private AiTransformType firstAiType(EditRequest request) {
        if (request.steps() == null) return null;
        return request.steps().stream()
                .filter(step -> step != null && step.op() != null && step.op().isAi())
                .map(step -> step.op().aiType())
                .findFirst()
                .orElse(null);
    }

    private String outputFormat(EditRequest request) {
        if (request.output() == null || request.output().format() == null) return null;
        String format = request.output().format().trim().toLowerCase(Locale.ROOT);
        return format.isBlank() || format.equals("auto") ? null : format;
    }

    static String buildDerivedFileName(String originalFileName, String format) {
        int dotIndex = originalFileName.lastIndexOf('.');
        String base = dotIndex > 0 ? originalFileName.substring(0, dotIndex) : originalFileName;
        String extension = dotIndex > 0 ? originalFileName.substring(dotIndex) : ".png";
        if (format != null) {
            extension = "." + format;
        }
        return base + "-edited" + extension;
    }

    private Photo getOwnedPhoto(User user, UUID photoId) {
        return photoRepository.findByIdAndUserId(photoId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
    }

    private static int requireRange(Integer value, String name, int min, int max, String label) {
        if (value == null) {
            throw new BadRequestException(label + ": " + name + " is required");
        }
        if (value < min || value > max) {
            throw new BadRequestException(label + ": " + name + " must be between " + min + " and " + max);
        }
        return value;
    }

    private static String optionalChoice(String value, Set<String> allowed, String fallback, String name, String label) {
        if (value == null || value.isBlank()) return fallback;
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (!allowed.contains(normalized)) {
            throw new BadRequestException(label + ": unsupported " + name + " \"" + value + "\"");
        }
        return normalized;
    }

    private static String requireHexColor(String value, String label) {
        String normalized = value.trim().replace("#", "");
        if (!HEX_COLOR.matcher(normalized).matches()) {
            throw new BadRequestException(label + ": colour must be a hex value like FF8800");
        }
        return normalized.toUpperCase(Locale.ROOT);
    }
}
