package org.example.lenovonotebookmall.repository;

import org.example.lenovonotebookmall.entity.ProductSku;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductSkuRepository extends JpaRepository<ProductSku, Long> {
    List<ProductSku> findByProductId(Long productId);
}