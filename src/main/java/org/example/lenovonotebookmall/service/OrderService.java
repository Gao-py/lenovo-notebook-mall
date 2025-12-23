package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.*;
import org.example.lenovonotebookmall.repository.OrderRepository;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartService cartService;
    private final ProductService productService;
    private final PromotionService promotionService;
    private final VipService vipService;

    public List<Order> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreateTimeDesc(userId);
    }

    @Transactional
    public Order createOrder(String username, String address, String phone) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        List<CartItem> cartItems = cartService.getCartItems(username);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("购物车为空");
        }

        Order order = new Order();
        order.setUser(user);
        order.setAddress(address);
        order.setStatus(Order.OrderStatus.PAID);

        List<OrderItem> orderItems = cartItems.stream().map(cartItem -> {
            Product product = cartItem.getProduct();

            if (product.getStock() < cartItem.getQuantity()) {
                throw new RuntimeException("商品 " + product.getName() + " 库存不足");
            }

            BigDecimal finalPrice = promotionService.calculateProductDiscount(product, product.getPrice());

            product.setStock(product.getStock() - cartItem.getQuantity());
            product.setSales((product.getSales() == null ? 0 : product.getSales()) + cartItem.getQuantity());
            productService.saveProduct(product);

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(cartItem.getQuantity());
            item.setPrice(finalPrice);
            return item;
        }).collect(Collectors.toList());

        order.setItems(orderItems);

        BigDecimal subtotal = orderItems.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal afterPromotion = promotionService.applyCartFullReduction(subtotal);

        BigDecimal vipDiscount = vipService.getVipDiscount(user.getVipLevel());
        BigDecimal finalTotal = afterPromotion.multiply(vipDiscount).setScale(2, java.math.RoundingMode.HALF_UP);

        order.setTotalAmount(finalTotal);

        Order savedOrder = orderRepository.save(order);

        vipService.updateVipLevel(username, finalTotal);

        cartService.clearCart(username);

        return savedOrder;
    }
}