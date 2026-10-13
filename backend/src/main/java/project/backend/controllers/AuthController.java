package project.backend.controllers;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import project.backend.dto.*;
import project.backend.services.AuthService;
import project.backend.services.UserService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private  final AuthService authService;
    private  final UserService  userService;
    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request)
    {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }
    @PostMapping("/login")
    public ResponseEntity<AuthResponse>login(@Valid @RequestBody LoginRequest loginRequest)
    {
        return ResponseEntity.status(HttpStatus.OK).body(authService.login(loginRequest));
    }
@PostMapping("/refresh")
    public  ResponseEntity<AuthResponse>refresh(@Valid @RequestBody RefreshTokenRequest request)
    {
        return ResponseEntity.ok(authService.refresh(request.refreshToken()));

    }
    @PostMapping("/logout")
    public ResponseEntity<Void>logout(@RequestBody(required = false) RefreshTokenRequest request){
        if (request != null && request.refreshToken() != null) {
            authService.logout(request.refreshToken());
        }
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@ AuthenticationPrincipal UserDetails userDetails){
        return ResponseEntity.ok(userService.getUserResponseByEmail(userDetails.getUsername()));
    }
}
