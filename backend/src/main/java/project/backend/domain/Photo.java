package project.backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Photo {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "imagekit_file_id", nullable = false)
    private String imageKitFiled;

    @Column(name = "file_name", nullable = false)
    private String fileName;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;
@Column(name = "thumbnail_url", nullable = false)
    private String thumbnail;
@Column(name = "size_bytes", nullable = false)
private long sizeBytes;

private  int width;
private int height;

@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 20)
private PhotoStatus status;

}
