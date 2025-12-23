package org.example.lenovonotebookmall.controller;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.dto.RatingRequest;
import org.example.lenovonotebookmall.entity.OrderRating;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.example.lenovonotebookmall.service.OrderRatingService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class OrderRatingController {
    private final OrderRatingService ratingService;
    private final UserRepository userRepository;
    
    @PostMapping
    public ApiResponse<OrderRating> addRating(Authentication auth, @RequestBody RatingRequest request) {
        try {
            User user = userRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            OrderRating rating = ratingService.addRating(user.getId(), request);
            return ApiResponse.success(rating);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @GetMapping("/order-item/{orderItemId}")
    public ApiResponse<OrderRating> getRatingByOrderItem(@PathVariable Long orderItemId) {
        OrderRating rating = ratingService.getRatingByOrderItemId(orderItemId);
        return ApiResponse.success(rating);
    }

    @GetMapping("/order/{orderId}")
    public ApiResponse<List<OrderRating>> getRatingsByOrder(@PathVariable Long orderId) {
        List<OrderRating> ratings = ratingService.getRatingsByOrderId(orderId);
        return ApiResponse.success(ratings);
    }

    @GetMapping("/product/{productId}/average")
    public ApiResponse<Double> getAverageRating(@PathVariable Long productId) {
        Double avg = ratingService.getAverageRatingByProductId(productId);
        return ApiResponse.success(avg);
    }
}