package project.backend.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.backend.domain.User;
import project.backend.dto.UserResponse;
import project.backend.exception.UnauthorizedException;
import project.backend.repository.UserRepository;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class UserService {
//DI
    private final UserRepository userRepository;
//Autowire
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    public UserResponse getUserResponseByEmail(String email) {
        return toUserResponse(getByEmail(email));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }
    public Optional<String> findEmailById(UUID userId) {
        return userRepository.findById(userId).map(User::getEmail);
    }

    public boolean existsById(UUID userId) {
        return userRepository.existsById(userId);
    }

    public UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName());
    }
}
