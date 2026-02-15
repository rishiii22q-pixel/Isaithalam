package com.isaithalam.service;

import com.isaithalam.model.User;
import com.isaithalam.repository.UserRepository;
import com.isaithalam.dto.LoginRequest;
import com.isaithalam.dto.RegisterRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User findOrCreateByPhone(String phone, String name) {
        return userRepository.findByPhone(phone).orElseGet(() -> {
            User user = new User();
            user.setPhone(phone);
            user.setName(name != null ? name : "User");
            user.setProvider(User.AuthProvider.PHONE);
            user.setAvatarUrl("/images/default-avatar.svg");
            return userRepository.save(user);
        });
    }

    public User findOrCreateByEmail(String email, String name) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setEmail(email);
            user.setName(name != null ? name : email.split("@")[0]);
            user.setProvider(User.AuthProvider.GOOGLE);
            user.setAvatarUrl("/images/default-avatar.svg");
            return userRepository.save(user);
        });
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User registerUser(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setProvider(User.AuthProvider.EMAIL);
        user.setAvatarUrl("/images/default-avatar.svg");
        return userRepository.save(user);
    }

    public User loginUser(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword() != null && passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return user;
            }
        }
        return null;
    }

    public User save(User user) {
        return userRepository.save(user);
    }
}
