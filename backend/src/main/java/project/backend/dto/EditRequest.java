package project.backend.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EditRequest(
        @NotNull @Size(max = 12, message = "A pipeline can have at most 12 steps") List<@Valid EditStep> steps,
        @Valid EditOutput output
) {
}
