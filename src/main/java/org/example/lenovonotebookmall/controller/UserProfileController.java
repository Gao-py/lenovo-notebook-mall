package org.example.lenovonotebookmall.controller;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.dto.UserProfileRequest;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class UserProfileController {
    private final UserService userService;

    @GetMapping
    public ApiResponse<User> getProfile(Authentication auth) {
        try {
            if (auth == null || auth.getName() == null) {
                return ApiResponse.error("用户未登录");
            }

            User user = userService.getUserProfile(auth.getName());
            if (user == null) {
                return ApiResponse.error("用户不存在");
            }

            // 确保VIP积分字段不为null
            if (user.getVipPoints() == null) {
                user.setVipPoints(0);
            }

            user.setPassword(null); // 安全起见，不返回密码
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error("获取用户信息失败: " + e.getMessage());
        }
    }

    @PutMapping
    public ApiResponse<User> updateProfile(Authentication auth, @RequestBody UserProfileRequest request) {
        try {
            User user = userService.updateUserProfile(auth.getName(), request);
            user.setPassword(null);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}