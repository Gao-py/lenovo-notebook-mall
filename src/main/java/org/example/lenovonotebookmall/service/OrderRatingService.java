package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.RatingRequest;
import org.example.lenovonotebookmall.entity.Order;
import org.example.lenovonotebookmall.entity.OrderItem;
import org.example.lenovonotebookmall.entity.OrderRating;
import org.example.lenovonotebookmall.repository.OrderItemRepository;
import org.example.lenovonotebookmall.repository.OrderRatingRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderRatingService {
    private final OrderRatingRepository ratingRepository;
    private final OrderItemRepository orderItemRepository;
    
    public OrderRating addRating(Long userId, RatingRequest request) {
        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new RuntimeException("订单项不存在"));
        
        if (!orderItem.getOrder().getUser().getId().equals(userId)) {
            throw new RuntimeException("无权评价此订单");
        }
        
        if (orderItem.getOrder().getStatus() != Order.OrderStatus.PAID) {
            throw new RuntimeException("只能评价已支付的订单");
        }
        
        if (ratingRepository.findByOrderItemId(request.getOrderItemId()).isPresent()) {
            throw new RuntimeException("该商品已评价");
        }
        
        OrderRating rating = new OrderRating();
        rating.setOrderItem(orderItem);
        rating.setRating(request.getRating());
        rating.setComment(request.getComment());
        
        return ratingRepository.save(rating);
    }
    
    public OrderRating getRatingByOrderItemId(Long orderItemId) {
        return ratingRepository.findByOrderItemId(orderItemId).orElse(null);
    }

    public List<OrderRating> getRatingsByOrderId(Long orderId) {
        return ratingRepository.findByOrderId(orderId);
    }

    public Double getAverageRatingByProductId(Long productId) {
        List<OrderRating> ratings = ratingRepository.findByProductId(productId);
        if (ratings.isEmpty()) {
            return null;
        }
        return ratings.stream()
                .mapToInt(OrderRating::getRating)
                .average()
                .orElse(0.0);
    }
}