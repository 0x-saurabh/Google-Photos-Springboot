package project.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import project.backend.domain.Album;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlbumRepository extends JpaRepository<Album, UUID> {

    List<Album> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    Optional<Album> findByIdAndUserId(UUID id, UUID userId);

    @Query("""
            SELECT COUNT(ap) FROM AlbumPhoto ap
            WHERE ap.album.id = :albumId
              AND ap.photo.status = project.backend.domain.PhotoStatus.ACTIVE
            """)
    long countPhotosByAlbumId(@Param("albumId") UUID albumId);

    @Modifying
    @Query("UPDATE Album a SET a.coverPhoto = null WHERE a.coverPhoto.id = :photoId")
    void clearCoverPhoto(@Param("photoId") UUID photoId);
}