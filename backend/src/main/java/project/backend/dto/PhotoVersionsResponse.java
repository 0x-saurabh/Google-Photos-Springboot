package project.backend.dto;

import java.util.List;

/** The photo this one was derived from (if any) and the photos derived from it. */
public record PhotoVersionsResponse(
        PhotoResponse parent,
        List<PhotoResponse> derived
) {
}
