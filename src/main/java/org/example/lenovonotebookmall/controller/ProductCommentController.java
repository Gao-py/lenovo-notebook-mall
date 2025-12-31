package org.example.lenovonotebookmall.controller;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.dto.CommentRequest;
import org.example.lenovonotebookmall.dto.CommentResponse;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.example.lenovonotebookmall.service.ProductCommentService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class ProductCommentController {
    private final ProductCommentService commentService;
    private final UserRepository userRepository;

    @PostMapping
    public ApiResponse<Void> addComment(@RequestBody CommentRequest request, Authentication auth) {
        try {
            if (auth == null || auth.getName() == null) {
                return ApiResponse.error("请先登录");
            }

            User user = userRepository.findByUsername(auth.getName()).orElse(null);
            if (user == null) {
                return ApiResponse.error("用户不存在");
            }

            commentService.addComment(user.getId(), request);
            return ApiResponse.success(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @GetMapping("/product/{productId}")
    public ApiResponse<List<CommentResponse>> getComments(@PathVariable Long productId) {
        try {
            List<CommentResponse> comments = commentService.getCommentsByProductId(productId);
            return ApiResponse.success(comments);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error(e.getMessage());
        }
    }
}