package project.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import project.backend.domain.Photo;
import project.backend.domain.PhotoStatus;

public interface PhotoRepository extends JpaRepository<Photo, UUID> {
    Page<Photo> findByUserIdAndStatus(UUID userId, PhotoStatus status, Pageable pageable);

    Page<Photo> findByUserIdAndStatusAndFileNameContainingIgnoreCase(
            UUID userId, PhotoStatus status, String fileName, Pageable pageable);

    /**
     * Library listing: photos in one status whose file name contains {@code query}
     * (empty string matches all), leaving out photos that sit in a PIN-locked album.
     * Those are only reachable through the album once it is unlocked.
     */
    @Query("""
            SELECT p FROM Photo p
            WHERE p.user.id = :userId
              AND p.status = :status
              AND (:query = '' OR LOWER(p.fileName) LIKE LOWER(CONCAT('%', :query, '%')))
              AND NOT EXISTS (
                  SELECT ap.id FROM AlbumPhoto ap
                  WHERE ap.photo = p AND ap.album.locked = true
              )
            """)
    Page<Photo> findVisibleByUserIdAndStatus(
            @Param("userId") UUID userId,
            @Param("status") PhotoStatus status,
            @Param("query") String query,
            Pageable pageable);

    List<Photo> findByParentPhotoIdAndUserIdOrderByCreatedAtDesc(UUID parentPhotoId, UUID userId);

    List<Photo> findByIdInAndUserId(List<UUID> ids, UUID userId);

    Optional<Photo> findByIdAndUserId(UUID id, UUID userId);

    Optional<Photo> findByIdAndUserIdAndStatus(UUID id, UUID userId, PhotoStatus status);

    boolean existsByImagekitFileIdAndUserId(String imagekitFileId, UUID userId);

    long countByUserIdAndStatus(UUID userId, PhotoStatus status);

    @Query("""
            SELECT COALESCE(SUM(p.sizeBytes), 0)
            FROM Photo p
            WHERE p.user.id = :userId AND p.status = :status
            """)
    long sumActivePhotoBytesByUserId(UUID userId, PhotoStatus status);

    default long sumActivePhotoBytesByUserId(UUID userId) {
        return sumActivePhotoBytesByUserId(userId, PhotoStatus.ACTIVE);
    }
}