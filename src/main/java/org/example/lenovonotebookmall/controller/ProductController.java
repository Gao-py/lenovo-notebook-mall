package org.example.lenovonotebookmall.controller;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.entity.Product;
import org.example.lenovonotebookmall.service.ProductService;
import org.example.lenovonotebookmall.service.PromotionService;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;
    private final PromotionService promotionService;

    @GetMapping
    public ApiResponse<List<Product>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String sortBy) {
        List<Product> products = productService.searchProducts(category, minPrice, maxPrice, sortBy);
        products.forEach(p -> {
            BigDecimal discountPrice = promotionService.calculateProductDiscount(p, p.getPrice());
            if (discountPrice.compareTo(p.getPrice()) < 0) {
                p.setPrice(discountPrice);
            }
        });
        return ApiResponse.success(products);
    }
    
    @GetMapping("/{id}")
    public ApiResponse<Product> getProduct(@PathVariable Long id) {
        try {
            Product product = productService.getProductById(id);
            BigDecimal discountPrice = promotionService.calculateProductDiscount(product, product.getPrice());
            if (discountPrice.compareTo(product.getPrice()) < 0) {
                product.setPrice(discountPrice);
            }
            return ApiResponse.success(product);
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

    @GetMapping("/category/{category}")
    public ApiResponse<List<Product>> getByCategory(@PathVariable String category) {
        return ApiResponse.success(productService.searchByCategory(category));
    }

    @GetMapping("/model/{model}")
    public ApiResponse<List<Product>> getByExactModel(@PathVariable String model) {
        return ApiResponse.success(productService.getProductsByExactModel(model));
    }
}