package org.example.lenovonotebookmall.controller;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.*;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.service.EmailService;
import org.example.lenovonotebookmall.service.UserService;
import org.example.lenovonotebookmall.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @PostMapping("/send-code")
    public ApiResponse<Void> sendVerificationCode(@RequestParam String email) {
        try {
            if (userService.existsByEmail(email)) {
                return ApiResponse.error("邮箱已被注册");
            }
            emailService.sendVerificationCode(email);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error("发送失败：" + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ApiResponse<String> register(@RequestBody RegisterRequest request) {
        if (userService.existsByUsername(request.getUsername())) {
            return ApiResponse.error("用户名已存在");
        }
        if (userService.existsByEmail(request.getEmail())) {
            return ApiResponse.error("邮箱已被注册");
        }
        if (!emailService.verifyCode(request.getEmail(), request.getVerificationCode())) {
            return ApiResponse.error("验证码错误或已过期");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setRole(User.UserRole.USER);

        userService.register(user);
        return ApiResponse.success("注册成功");
    }
    
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request.getUsername(), request.getPassword());
            String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
            return ApiResponse.success(new LoginResponse(token, user.getRole().name()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(@RequestParam String email,
                                          @RequestParam String code,
                                          @RequestParam String newPassword) {
        if (!emailService.verifyCode(email, code)) {
            return ApiResponse.error("验证码错误或已过期");
        }

        try {
            userService.resetPassword(email, newPassword);
            return ApiResponse.success("密码重置成功");
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}