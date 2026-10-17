package project.backend.services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import project.backend.config.JwtProperties;
import project.backend.domain.User;

import org.springframework.stereotype.Service;


import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = buildKey(jwtProperties.secret());
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(jwtProperties.accessExpirationMs());

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(secretKey)
                .compact();
    }

    /**
     * Proves the holder entered the PIN of one album. Scoped to the user and the
     * album, short-lived, and never accepted as an access token (different type).
     */
    public String generateAlbumToken(User user, UUID albumId, Duration ttl) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("type", "album")
                .claim("album", albumId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .signWith(secretKey)
                .compact();
    }

    /** The album an album token unlocks for {@code userId}, or empty when invalid, expired or someone else's. */
    public Optional<UUID> extractUnlockedAlbumId(String token, UUID userId) {
        try {
            Claims claims = parseClaims(token);
            if (!"album".equals(claims.get("type", String.class))) return Optional.empty();
            if (!userId.toString().equals(claims.getSubject())) return Optional.empty();
            if (!claims.getExpiration().after(new Date())) return Optional.empty();
            return Optional.of(UUID.fromString(claims.get("album", String.class)));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    public String generateRefreshTokenValue() {
        return UUID.randomUUID().toString() + "." + UUID.randomUUID();
    }

    public Instant refreshTokenExpiry() {
        return Instant.now().plusMillis(jwtProperties.refreshExpirationMs());
    }

    public UUID extractUserId(String token) {
        Claims claims = parseClaims(token);
        return UUID.fromString(claims.getSubject());
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(new Date()) && "access".equals(claims.get("type", String.class));
        } catch (Exception ex) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey buildKey(String secret) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            try {
                keyBytes = MessageDigest.getInstance("SHA-256").digest(keyBytes);
            } catch (NoSuchAlgorithmException ex) {
                throw new IllegalStateException("SHA-256 not available", ex);
            }
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}