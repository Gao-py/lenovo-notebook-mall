package org.example.lenovonotebookmall.controller;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.entity.Product;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.example.lenovonotebookmall.service.ProductService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final ProductService productService;
    private final UserRepository userRepository;

    @PostMapping("/products")
    public ApiResponse<Product> addProduct(@RequestBody Product product) {
        return ApiResponse.success(productService.saveProduct(product));
    }
    
    @PutMapping("/products/{id}")
    public ApiResponse<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        product.setId(id);
        return ApiResponse.success(productService.saveProduct(product));
    }
    
    @DeleteMapping("/products/{id}")
    public ApiResponse<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/users")
    public ApiResponse<List<User>> getAllUsers() {
        return ApiResponse.success(userRepository.findAll());
    }
}