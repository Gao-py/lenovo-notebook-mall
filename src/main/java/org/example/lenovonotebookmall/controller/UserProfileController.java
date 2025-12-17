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
            User user = userService.getUserProfile(auth.getName());
            user.setPassword(null);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
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