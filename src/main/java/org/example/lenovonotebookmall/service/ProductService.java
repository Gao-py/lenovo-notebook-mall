package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.Product;
import org.example.lenovonotebookmall.repository.ProductRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("商品不存在"));
    }
    
    public List<Product> searchByModel(String model) {
        return productRepository.findByModelContaining(model);
    }
    
    public List<Product> searchByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        return productRepository.findByPriceBetween(minPrice, maxPrice);
    }
    
    public List<Product> searchByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public List<Product> searchProducts(String category, BigDecimal minPrice, BigDecimal maxPrice, String sortBy) {
        List<Product> products;

        if (category != null && !category.isEmpty() && minPrice != null && maxPrice != null) {
            products = productRepository.findByCategoryAndPriceBetween(category, minPrice, maxPrice);
        } else if (category != null && !category.isEmpty()) {
            products = productRepository.findByCategory(category);
        } else if (minPrice != null && maxPrice != null) {
            products = productRepository.findByPriceBetween(minPrice, maxPrice);
        } else {
            products = productRepository.findAll();
        }

        return sortProducts(products, sortBy);
    }

    private List<Product> sortProducts(List<Product> products, String sortBy) {
        if (sortBy == null || sortBy.isEmpty()) {
            return products;
        }

        return switch (sortBy) {
            case "price_asc" -> products.stream()
                    .sorted(Comparator.comparing(Product::getPrice))
                    .collect(Collectors.toList());
            case "price_desc" -> products.stream()
                    .sorted(Comparator.comparing(Product::getPrice).reversed())
                    .collect(Collectors.toList());
            case "sales_desc" -> products.stream()
                    .sorted(Comparator.comparing(Product::getSales).reversed())
                    .collect(Collectors.toList());
            case "name_asc" -> products.stream()
                    .sorted(Comparator.comparing(Product::getName))
                    .collect(Collectors.toList());
            default -> products;
        };
    }

    public List<Product> getProductsByExactModel(String model) {
        return productRepository.findByModel(model);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }
    
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}