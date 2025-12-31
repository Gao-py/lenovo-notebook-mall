package org.example.lenovonotebookmall.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.entity.Order;
import org.example.lenovonotebookmall.entity.OrderRating;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.OrderRatingRepository;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.example.lenovonotebookmall.service.OrderService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;
    private final UserRepository userRepository;
    private final OrderRatingRepository orderRatingRepository;

    @GetMapping("/my")
    public ApiResponse<OrdersWithRatings> getMyOrders(Authentication auth) {
        try {
            Long userId = 1L;
            if (auth != null && auth.getName() != null) {
                User user = userRepository.findByUsername(auth.getName()).orElse(null);
                if (user != null) userId = user.getId();
            }
            List<Order> orders = orderService.getUserOrders(userId);

            List<Long> orderItemIds = orders.stream()
                    .flatMap(order -> order.getItems().stream())
                    .map(item -> item.getId())
                    .collect(Collectors.toList());

            Map<Long, OrderRating> ratingsMap = new HashMap<>();
            if (!orderItemIds.isEmpty()) {
                List<OrderRating> ratings = orderRatingRepository.findAll().stream()
                        .filter(r -> r.getOrderItem() != null && orderItemIds.contains(r.getOrderItem().getId()))
                        .collect(Collectors.toList());

                ratings.forEach(r -> ratingsMap.put(r.getOrderItem().getId(), r));
            }

            OrdersWithRatings result = new OrdersWithRatings();
            result.setOrders(orders);
            result.setRatings(ratingsMap);

            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/checkout")
    public ApiResponse<Order> checkout(Authentication auth, @RequestBody CheckoutRequest request) {
        try {
            Order order = orderService.createOrder(auth.getName(), request.getAddress(),
                    request.getPhone(), request.getUserCouponId());
            return ApiResponse.success(order);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Data
    public static class CheckoutRequest {
        private String address;
        private String phone;
        private Long userCouponId;
    }

    @Data
    public static class OrdersWithRatings {
        private List<Order> orders;
        private Map<Long, OrderRating> ratings;
    }
}