package com.isaithalam.service;

import com.isaithalam.model.User;
import com.isaithalam.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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

    public User save(User user) {
        return userRepository.save(user);
    }
}
