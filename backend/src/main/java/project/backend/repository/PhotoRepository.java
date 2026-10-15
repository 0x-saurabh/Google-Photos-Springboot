package project.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import project.backend.domain.Photo;
import project.backend.domain.PhotoStatus;

public interface PhotoRepository extends JpaRepository<Photo, UUID> {
    Page<Photo> findByUserIdAndStatus(UUID userId, PhotoStatus status, Pageable pageable);

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