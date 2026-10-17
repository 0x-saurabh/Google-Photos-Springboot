package project.backend.exception;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Every API error is a JSON body of the shape {"message": "..."} with a
 * meaningful status. Without the catch-all at the bottom, unhandled exceptions
 * were dispatched to /error, which the security filter answered with 403.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler({
          BadRequestException.class,
          ResourceConflictException.class,
          UnauthorizedException.class,
  })
  public ResponseEntity<Map<String, String>> handleBadRequest(RuntimeException ex) {
    return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
  }

  /** 423 Locked carries the album id so the client can send the user to its PIN screen. */
  @ExceptionHandler(AlbumLockedException.class)
  public ResponseEntity<Map<String, String>> handleAlbumLocked(AlbumLockedException ex) {
    return ResponseEntity.status(HttpStatus.LOCKED)
            .body(Map.of("message", ex.getMessage(), "albumId", ex.getAlbumId().toString()));
  }

  @ExceptionHandler(TooManyAttemptsException.class)
  public ResponseEntity<Map<String, String>> handleTooManyAttempts(TooManyAttemptsException ex) {
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<Map<String, String>> handleNoResource(NoResourceFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "No such endpoint"));
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid credentials"));
  }

  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<Map<String, String>> handleAuthentication(AuthenticationException ex) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication required"));
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You don't have access to this"));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(FieldError::getDefaultMessage)
            .orElse("Validation failed");
    return ResponseEntity.badRequest().body(Map.of("message", message));
  }

  @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
  public ResponseEntity<Map<String, String>> handleUnreadable(Exception ex) {
    return ResponseEntity.badRequest().body(Map.of("message", "The request could not be read"));
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ResponseEntity<Map<String, String>> handleTooLarge(MaxUploadSizeExceededException ex) {
    return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(Map.of("message", "The file is larger than the server allows"));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException ex) {
    log.warn("Data integrity violation", ex);
    return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("message", "This change conflicts with other data in your library"));
  }

  @ExceptionHandler(ImageKitUploadException.class)
  public ResponseEntity<Map<String, String>> handleImageKitUpload(ImageKitUploadException ex) {
    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, String>> handleUnexpected(Exception ex) {
    log.error("Unhandled exception", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("message", "Something went wrong on the server. Please try again."));
  }
}
