package org.example.lenovonotebookmall.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "coupons")
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    private CouponType type;
    
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal minAmount;
    
    @Column(nullable = false)
    private Integer pointsCost;
    
    private Integer stock;
    
    private Integer validHours;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    private String category;

    public enum CouponType {
        DISCOUNT,
        CASH,
        FULL_REDUCTION
    }
}