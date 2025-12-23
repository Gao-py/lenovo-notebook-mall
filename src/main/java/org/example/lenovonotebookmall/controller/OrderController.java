package org.example.lenovonotebookmall.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.entity.Order;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.example.lenovonotebookmall.service.OrderService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;
    private final UserRepository userRepository;

    @GetMapping("/my")
    public ApiResponse<List<Order>> getMyOrders(Authentication auth) {
        try {
            Long userId = 1L;
            if (auth != null && auth.getName() != null) {
                User user = userRepository.findByUsername(auth.getName()).orElse(null);
                if (user != null) userId = user.getId();
            }
            List<Order> orders = orderService.getUserOrders(userId);
            return ApiResponse.success(orders);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/checkout")
    public ApiResponse<Order> checkout(Authentication auth, @RequestBody CheckoutRequest request) {
        try {
            Order order = orderService.createOrder(auth.getName(), request.getAddress(), request.getPhone());
            return ApiResponse.success(order);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Data
    public static class CheckoutRequest {
        private String address;
        private String phone;
    }
}