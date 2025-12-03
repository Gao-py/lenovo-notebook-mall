package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.CartItem;
import org.example.lenovonotebookmall.entity.Product;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.CartItemRepository;
import org.example.lenovonotebookmall.repository.ProductRepository;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    
    public List<CartItem> getCartItems(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return cartItemRepository.findByUserId(user.getId());
    }
    
    public void addToCart(String username, Long productId, Integer quantity) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("商品不存在"));
        
        CartItem cartItem = cartItemRepository.findByUserIdAndProductId(user.getId(), productId)
                .orElse(new CartItem());
        
        cartItem.setUser(user);
        cartItem.setProduct(product);
        cartItem.setQuantity(cartItem.getQuantity() == null ? quantity : cartItem.getQuantity() + quantity);
        cartItemRepository.save(cartItem);
    }
    
    public void updateQuantity(Long cartItemId, Integer quantity) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("购物车项不存在"));
        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);
    }
    
    public void removeFromCart(Long cartItemId) {
        cartItemRepository.deleteById(cartItemId);
    }
    
    @Transactional
    public void clearCart(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        cartItemRepository.deleteByUserId(user.getId());
    }
    
    public BigDecimal calculateTotal(String username) {
        List<CartItem> items = getCartItems(username);
        return items.stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}