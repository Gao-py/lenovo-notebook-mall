package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.controller.CaptchaController;
import org.example.lenovonotebookmall.dto.LoginRequest;
import org.example.lenovonotebookmall.dto.LoginResponse;
import org.example.lenovonotebookmall.dto.RegisterRequest;
import org.example.lenovonotebookmall.dto.UserProfileRequest;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.example.lenovonotebookmall.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    public String register(RegisterRequest request) {
        if (!CaptchaController.verify(request.getCaptchaKey(), request.getCaptchaCode())) {
            throw new RuntimeException("验证码错误");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("邮箱已被注册");
        }
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setNickname(request.getUsername());
        userRepository.save(user);
        
        return jwtUtil.generateToken(user.getUsername());
    }
    
    public LoginResponse login(LoginRequest request) {
        if (!CaptchaController.verify(request.getCaptchaKey(), request.getCaptchaCode())) {
            throw new RuntimeException("验证码错误");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        
        String token = jwtUtil.generateToken(user.getUsername());
        return new LoginResponse(token, user.getRole().name());
    }
    
    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("邮箱未注册"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User getUserProfile(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }

    public User updateUserProfile(String username, UserProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (request.getNickname() != null) user.setNickname(request.getNickname());
        if (request.getAvatar() != null) user.setAvatar(request.getAvatar());
        if (request.getBirthday() != null) user.setBirthday(request.getBirthday());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getSignature() != null) user.setSignature(request.getSignature());

        return userRepository.save(user);
    }
}