package project.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import project.backend.domain.EditOp;
import project.backend.domain.Photo;
import project.backend.dto.EditOutput;
import project.backend.dto.EditRequest;
import project.backend.dto.EditStep;
import project.backend.exception.BadRequestException;

/** Pure unit tests for the chain builder; no Spring context or database needed. */
class PhotoEditServiceTest {

    private final PhotoEditService service = new PhotoEditService(
            null, null, null, new AiTransformService(null, null, null, null), null);

    private static Photo photo(Integer width, Integer height) {
        return Photo.builder().width(width).height(height).fileName("sunset.jpg").build();
    }

    private static EditStep step(EditOp op) {
        return new EditStep(op, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    private static EditStep crop(int x, int y, int w, int h) {
        return new EditStep(EditOp.CROP, x, y, w, h, null, null, null, null, null, null, null, null, null);
    }

    private static EditStep resize(Integer w, Integer h, String fit, String color) {
        return new EditStep(EditOp.RESIZE, null, null, w, h, null, null, fit, null, null, null, color, null, null);
    }

    private static EditStep amount(EditOp op, Integer amount) {
        return new EditStep(op, null, null, null, null, null, null, null, null, null, amount, null, null, null);
    }

    @Test
    void chainsStepsInOrderWithOutputLast() {
        EditRequest request = new EditRequest(
                List.of(
                        crop(10, 20, 300, 200),
                        new EditStep(EditOp.ROTATE, null, null, null, null, null, null, null, 90, null, null, null, null, null),
                        step(EditOp.GRAYSCALE)),
                new EditOutput("webp", 80));

        assertEquals("cm-extract,w-300,h-200,x-10,y-20:rt-90:e-grayscale:f-webp,q-80",
                service.buildChain(request, photo(1200, 800)));
    }

    @Test
    void aspectCropFitsInsideOriginalWithoutUpscaling() {
        EditStep landscape = new EditStep(EditOp.ASPECT_CROP, null, null, null, null, "16:9", "face", null, null, null, null, null, null, null);
        assertEquals("w-1200,h-675,fo-face", service.buildChain(new EditRequest(List.of(landscape), null), photo(1200, 800)));

        EditStep portrait = new EditStep(EditOp.ASPECT_CROP, null, null, null, null, "9:16", null, null, null, null, null, null, null, null);
        assertEquals("w-450,h-800,fo-auto", service.buildChain(new EditRequest(List.of(portrait), null), photo(1200, 800)));

        // Unknown dimensions fall back to ImageKit's own aspect-ratio parameter.
        assertEquals("ar-16-9,fo-face", service.buildChain(new EditRequest(List.of(landscape), null), photo(null, null)));
    }

    @Test
    void resizeModesMapToImageKitCropParameters() {
        Photo photo = photo(1200, 800);
        assertEquals("w-600,h-400,fo-auto", service.buildChain(new EditRequest(List.of(resize(600, 400, "cover", null)), null), photo));
        assertEquals("w-600,h-400,c-at_max", service.buildChain(new EditRequest(List.of(resize(600, 400, "contain", null)), null), photo));
        assertEquals("w-600,h-400,c-force", service.buildChain(new EditRequest(List.of(resize(600, 400, "stretch", null)), null), photo));
        assertEquals("w-600,h-400,cm-pad_resize,bg-FF8800", service.buildChain(new EditRequest(List.of(resize(600, 400, "pad", "#ff8800")), null), photo));
        assertEquals("w-600", service.buildChain(new EditRequest(List.of(resize(600, null, null, null)), null), photo));
    }

    @Test
    void effectsAndAiStepsRenderTheirSegments() {
        Photo photo = photo(1200, 800);
        assertEquals("bl-12", service.buildChain(new EditRequest(List.of(amount(EditOp.BLUR, 12)), null), photo));
        assertEquals("e-sharpen-5", service.buildChain(new EditRequest(List.of(amount(EditOp.SHARPEN, 5)), null), photo));
        assertEquals("r-max", service.buildChain(new EditRequest(List.of(step(EditOp.ROUND)), null), photo));
        assertEquals("b-4_000000", service.buildChain(new EditRequest(List.of(amount(EditOp.BORDER, 4)), null), photo));
        assertEquals("t-true", service.buildChain(new EditRequest(List.of(step(EditOp.TRIM)), null), photo));
        assertEquals("e-bgremove:e-upscale", service.buildChain(
                new EditRequest(List.of(step(EditOp.REMOVE_BACKGROUND), step(EditOp.UPSCALE)), null), photo));

        EditStep changeBg = new EditStep(EditOp.CHANGE_BACKGROUND, null, null, null, null, null, null, null, null, null, null, null, "snowy forest", null);
        assertEquals("e-changebg-prompt-snowy+forest", service.buildChain(new EditRequest(List.of(changeBg), null), photo));
    }

    @Test
    void rejectsInvalidSteps() {
        Photo photo = photo(1200, 800);

        BadRequestException outside = assertThrows(BadRequestException.class,
                () -> service.buildChain(new EditRequest(List.of(crop(1000, 0, 300, 200)), null), photo));
        assertTrue(outside.getMessage().contains("right edge"));

        assertThrows(BadRequestException.class,
                () -> service.buildChain(new EditRequest(List.of(amount(EditOp.BLUR, 101)), null), photo));
        assertThrows(BadRequestException.class,
                () -> service.buildChain(new EditRequest(List.of(resize(null, null, null, null)), null), photo));
        assertThrows(BadRequestException.class,
                () -> service.buildChain(new EditRequest(List.of(step(EditOp.CHANGE_BACKGROUND)), null), photo));
        assertThrows(BadRequestException.class,
                () -> service.buildChain(new EditRequest(List.of(), new EditOutput("bmp", null)), photo));
    }

    @Test
    void derivedFileNameUsesOutputFormat() {
        assertEquals("sunset-edited.jpg", PhotoEditService.buildDerivedFileName("sunset.jpg", null));
        assertEquals("sunset-edited.webp", PhotoEditService.buildDerivedFileName("sunset.jpg", "webp"));
        assertEquals("sunset-edited.png", PhotoEditService.buildDerivedFileName("sunset", null));
    }
}
