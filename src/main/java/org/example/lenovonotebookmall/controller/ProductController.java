package org.example.lenovonotebookmall.controller;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.entity.Product;
import org.example.lenovonotebookmall.service.ProductService;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;
    
    @GetMapping
    public ApiResponse<List<Product>> getAllProducts() {
        return ApiResponse.success(productService.getAllProducts());
    }
    
    @GetMapping("/{id}")
    public ApiResponse<Product> getProduct(@PathVariable Long id) {
        try {
            return ApiResponse.success(productService.getProductById(id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @GetMapping("/search")
    public ApiResponse<List<Product>> searchByModel(@RequestParam String model) {
        return ApiResponse.success(productService.searchByModel(model));
    }
    
    @GetMapping("/price-range")
    public ApiResponse<List<Product>> searchByPrice(@RequestParam BigDecimal min, @RequestParam BigDecimal max) {
        return ApiResponse.success(productService.searchByPriceRange(min, max));
    }
}