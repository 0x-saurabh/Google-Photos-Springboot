package project.backend.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.backend.domain.Album;
import project.backend.domain.AlbumPhoto;
import project.backend.domain.Photo;
import project.backend.domain.PhotoStatus;
import project.backend.domain.User;
import project.backend.dto.AddPhotosToAlbumRequest;
import project.backend.dto.AlbumResponse;
import project.backend.dto.CreateAlbumRequest;
import project.backend.dto.PageResponse;
import project.backend.dto.PhotoResponse;
import project.backend.dto.UpdateAlbumRequest;
import project.backend.exception.BadRequestException;
import project.backend.exception.ResourceNotFoundException;
import project.backend.repository.AlbumPhotoRepository;
import project.backend.repository.AlbumRepository;
import project.backend.repository.PhotoRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final AlbumPhotoRepository albumPhotoRepository;
    private final PhotoRepository photoRepository;
    private final PhotoService photoService;
    private final AlbumAccessService albumAccessService;

    public AlbumService(
            AlbumRepository albumRepository,
            AlbumPhotoRepository albumPhotoRepository,
            PhotoRepository photoRepository,
            PhotoService photoService,
            AlbumAccessService albumAccessService
    ) {
        this.albumRepository = albumRepository;
        this.albumPhotoRepository = albumPhotoRepository;
        this.photoRepository = photoRepository;
        this.photoService = photoService;
        this.albumAccessService = albumAccessService;
    }

    @Transactional(readOnly = true)
    public List<AlbumResponse> listAlbums(User user) {
        return albumRepository.findByUserIdOrderByUpdatedAtDesc(user.getId()).stream()
                .map(album -> toAlbumResponse(user, album, albumRepository.countPhotosByAlbumId(album.getId())))
                .toList();
    }

    /** Album metadata is readable while locked (title, count, lock state); the cover is withheld. */
    @Transactional(readOnly = true)
    public AlbumResponse getAlbum(User user, UUID albumId) {
        Album album = getOwnedAlbum(user, albumId);
        return toAlbumResponse(user, album, albumRepository.countPhotosByAlbumId(album.getId()));
    }

    @Transactional(readOnly = true)
    public PageResponse<PhotoResponse> getAlbumPhotos(User user, UUID albumId, Pageable pageable) {
        Album album = getOwnedAlbum(user, albumId);
        albumAccessService.requireUnlocked(user, album);
        Page<AlbumPhoto> page = albumPhotoRepository.findByAlbumIdAndUserId(albumId, user.getId(), pageable);
        List<PhotoResponse> photos = page.getContent().stream()
                .map(AlbumPhoto::getPhoto)
                .map(photoService::toPhotoResponse)
                .toList();

        return new PageResponse<>(
                photos,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Transactional
    public AlbumResponse createAlbum(User user, CreateAlbumRequest request) {
        Album album = Album.builder()
                .user(user)
                .title(request.title().trim())
                .build();
        return toAlbumResponse(user, albumRepository.save(album), 0);
    }

    @Transactional
    public AlbumResponse updateAlbum(User user, UUID albumId, UpdateAlbumRequest request) {
        Album album = getOwnedAlbum(user, albumId);
        albumAccessService.requireUnlocked(user, album);

        if (request.title() != null && !request.title().isBlank()) {
            album.setTitle(request.title().trim());
        }

        if (request.coverPhotoId() != null) {
            Photo coverPhoto = photoRepository.findByIdAndUserId(request.coverPhotoId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cover photo not found"));
            if (coverPhoto.getStatus() != PhotoStatus.ACTIVE) {
                throw new BadRequestException("Cover photo must be active");
            }
            album.setCoverPhoto(coverPhoto);
        }

        return toAlbumResponse(
                user,
                albumRepository.save(album),
                albumRepository.countPhotosByAlbumId(album.getId())
        );
    }

    @Transactional
    public void deleteAlbum(User user, UUID albumId) {
        Album album = getOwnedAlbum(user, albumId);
        albumAccessService.requireUnlocked(user, album);
        albumPhotoRepository.deleteByAlbumId(album.getId());
        albumRepository.delete(album);
    }

    @Transactional
    public void addPhotosToAlbum(User user, UUID albumId, AddPhotosToAlbumRequest request) {
        Album album = getOwnedAlbum(user, albumId);
        albumAccessService.requireUnlocked(user, album);
        List<Photo> photos = photoRepository.findByIdInAndUserId(request.photoIds(), user.getId());

        if (photos.size() != request.photoIds().size()) {
            throw new ResourceNotFoundException("One or more photos were not found");
        }

        int sortOrder = albumPhotoRepository.findMaxSortOrder(albumId);
        List<AlbumPhoto> albumPhotos = new ArrayList<>();

        for (Photo photo : photos) {
            if (photo.getStatus() != PhotoStatus.ACTIVE) {
                throw new BadRequestException("Only active photos can be added to albums");
            }
            if (albumPhotoRepository.existsByAlbumIdAndPhotoId(albumId, photo.getId())) {
                continue;
            }
            sortOrder++;
            albumPhotos.add(AlbumPhoto.builder()
                    .album(album)
                    .photo(photo)
                    .sortOrder(sortOrder)
                    .build());
        }

        albumPhotoRepository.saveAll(albumPhotos);

        if (album.getCoverPhoto() == null && !photos.isEmpty()) {
            album.setCoverPhoto(photos.get(0));
            albumRepository.save(album);
        }
    }

    @Transactional
    public void removePhotoFromAlbum(User user, UUID albumId, UUID photoId) {
        Album album = getOwnedAlbum(user, albumId);
        albumAccessService.requireUnlocked(user, album);
        if (!albumPhotoRepository.existsByAlbumIdAndPhotoId(albumId, photoId)) {
            throw new ResourceNotFoundException("Photo not found in album");
        }
        albumPhotoRepository.deleteByAlbumIdAndPhotoId(albumId, photoId);
    }

    private Album getOwnedAlbum(User user, UUID albumId) {
        return albumRepository.findByIdAndUserId(albumId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Album not found"));
    }

    public AlbumResponse toAlbumResponse(User user, Album album, long photoCount) {
        boolean unlocked = albumAccessService.isUnlocked(user, album);
        Photo coverPhoto = album.getCoverPhoto();
        if (coverPhoto != null && coverPhoto.getStatus() != PhotoStatus.ACTIVE) {
            // An archived or trashed cover shouldn't leak into the album grid.
            coverPhoto = null;
        }
        if (album.isLocked() && !unlocked) {
            // The cover would reveal what is inside a private album.
            coverPhoto = null;
        }
        return new AlbumResponse(
                album.getId(),
                album.getTitle(),
                coverPhoto != null ? coverPhoto.getId() : null,
                coverPhoto != null ? coverPhoto.getThumbnailUrl() : null,
                photoCount,
                album.isLocked(),
                album.isLocked() && unlocked,
                album.getCreatedAt(),
                album.getUpdatedAt()
        );
    }
}