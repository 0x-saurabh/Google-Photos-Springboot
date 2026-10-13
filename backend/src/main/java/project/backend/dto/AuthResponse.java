package project.backend.dto;

public record AuthResponse(
        String access_token,
        String refresh_token,
        UserResponse user
) {

}
