package org.example.lenovonotebookmall.controller;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.entity.CartItem;
import org.example.lenovonotebookmall.service.CartService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;
    
    @GetMapping
    public ApiResponse<List<CartItem>> getCart(Authentication auth) {
        return ApiResponse.success(cartService.getCartItems(auth.getName()));
    }
    
    @PostMapping("/add")
    public ApiResponse<Void> addToCart(Authentication auth, @RequestParam Long productId, @RequestParam Integer quantity) {
        try {
            cartService.addToCart(auth.getName(), productId, quantity);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ApiResponse<Void> updateQuantity(@PathVariable Long id, @RequestParam Integer quantity) {
        try {
            cartService.updateQuantity(id, quantity);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ApiResponse<Void> removeFromCart(@PathVariable Long id) {
        cartService.removeFromCart(id);
        return ApiResponse.success(null);
    }
    
    @GetMapping("/total")
    public ApiResponse<BigDecimal> getTotal(Authentication auth) {
        return ApiResponse.success(cartService.calculateTotal(auth.getName()));
    }
    
    @DeleteMapping("/clear")
    public ApiResponse<Void> clearCart(Authentication auth) {
        cartService.clearCart(auth.getName());
        return ApiResponse.success(null);
    }
}