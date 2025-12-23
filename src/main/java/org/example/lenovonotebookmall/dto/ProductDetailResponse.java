package org.example.lenovonotebookmall.dto;

import lombok.Data;
import org.example.lenovonotebookmall.entity.Product;
import org.example.lenovonotebookmall.entity.ProductSku;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Data
public class ProductDetailResponse {
    private Product product;
    private List<ProductSku> skus;
    private Set<String> cpuOptions;
    private Set<String> memoryOptions;
    private Set<String> storageOptions;
    private Set<String> graphicsOptions;
    
    public ProductDetailResponse(Product product, List<ProductSku> skus) {
        this.product = product;
        this.skus = skus;
        this.cpuOptions = skus.stream().map(ProductSku::getCpu).collect(Collectors.toSet());
        this.memoryOptions = skus.stream().map(ProductSku::getMemory).collect(Collectors.toSet());
        this.storageOptions = skus.stream().map(ProductSku::getStorage).collect(Collectors.toSet());
        this.graphicsOptions = skus.stream().map(ProductSku::getGraphics).collect(Collectors.toSet());
    }
}