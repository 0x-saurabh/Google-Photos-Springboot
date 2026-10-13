package project.backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "refresh_tokens")
public class RefreshToken {
    @Id
    @GeneratedValue(strategy =  GenerationType.UUID)
    private UUID id;
    // this is Entity class
    @Column(nullable = false,unique = true)
    private String email;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;
    @Column(name = "createdAt", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate(){
        if(createdAt == null){
            createdAt=Instant.now();
        }
    }


}
