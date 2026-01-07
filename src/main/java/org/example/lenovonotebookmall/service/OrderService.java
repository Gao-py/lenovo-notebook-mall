package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.*;
import org.example.lenovonotebookmall.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private final UserCouponRepository userCouponRepository;

    public List<Order> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreateTimeDesc(userId);
    }

    @Transactional
    public Order createOrder(String username, String address, String phone, Long userCouponId) {
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

        if (userCouponId != null) {
            UserCoupon userCoupon = userCouponRepository.findById(userCouponId)
                    .orElseThrow(() -> new RuntimeException("优惠券不存在"));

            if (userCoupon.getIsUsed()) {
                throw new RuntimeException("优惠券已使用");
            }

            if (!userCoupon.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("无权使用此优惠券");
            }

            Coupon coupon = userCoupon.getCoupon();

            if (coupon.getProduct() != null) {
                boolean hasProduct = orderItems.stream()
                    .anyMatch(item -> item.getProduct().getId().equals(coupon.getProduct().getId()));
                if (!hasProduct) {
                    throw new RuntimeException("优惠券不适用于当前商品");
                }
            }

            if (coupon.getCategory() != null) {
                boolean hasCategory = orderItems.stream()
                    .anyMatch(item -> coupon.getCategory().equals(item.getProduct().getCategory()));
                if (!hasCategory) {
                    throw new RuntimeException("优惠券不适用于当前商品分类");
                }
            }

            afterPromotion = applyCoupon(afterPromotion, coupon, orderItems);

            userCoupon.setIsUsed(true);
            userCoupon.setUsedTime(LocalDateTime.now());
            userCouponRepository.save(userCoupon);
        }

        BigDecimal finalTotal = afterPromotion;
        if (vipService.canUseDiscount(user.getId(), user.getVipLevel())) {
            BigDecimal vipDiscount = vipService.getVipDiscount(user.getVipLevel());
            finalTotal = afterPromotion.multiply(vipDiscount).setScale(2, java.math.RoundingMode.HALF_UP);
            vipService.recordDiscountUsage(user.getId());
        }

        order.setTotalAmount(finalTotal);

        Order savedOrder = orderRepository.save(order);

        vipService.updateVipLevel(username, finalTotal);

        cartService.clearCart(username);

        return savedOrder;
    }

    private BigDecimal applyCoupon(BigDecimal amount, Coupon coupon, List<OrderItem> items) {
        if (coupon.getProduct() != null || coupon.getCategory() != null) {
            BigDecimal matchedAmount = items.stream()
                .filter(item -> {
                    if (coupon.getProduct() != null) {
                        return item.getProduct().getId().equals(coupon.getProduct().getId());
                    }
                    if (coupon.getCategory() != null) {
                        return coupon.getCategory().equals(item.getProduct().getCategory());
                    }
                    return false;
                })
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal unmatchedAmount = amount.subtract(matchedAmount);

            BigDecimal discountedAmount = switch (coupon.getType()) {
                case DISCOUNT -> matchedAmount.multiply(coupon.getDiscountPercent())
                        .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                case CASH -> matchedAmount.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
                case FULL_REDUCTION -> {
                    if (coupon.getMinAmount() != null && matchedAmount.compareTo(coupon.getMinAmount()) >= 0) {
                        yield matchedAmount.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
                    }
                    yield matchedAmount;
                }
            };

            return unmatchedAmount.add(discountedAmount);
        }

        return switch (coupon.getType()) {
            case DISCOUNT -> amount.multiply(coupon.getDiscountPercent())
                    .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            case CASH -> amount.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
            case FULL_REDUCTION -> {
                if (coupon.getMinAmount() != null && amount.compareTo(coupon.getMinAmount()) >= 0) {
                    yield amount.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
                }
                yield amount;
            }
        };
    }
}