package org.example.lenovonotebookmall.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "promotions")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;

    @Enumerated(EnumType.STRING)
    private PromotionType type;

    private BigDecimal minAmount;
    private BigDecimal discountAmount;
    private BigDecimal discountPercent;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    
    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    private String category;

    public enum PromotionType {
        FULL_REDUCTION,
        DISCOUNT,
        CATEGORY_DISCOUNT
    }
}