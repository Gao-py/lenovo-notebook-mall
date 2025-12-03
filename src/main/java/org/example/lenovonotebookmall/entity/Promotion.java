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
    private BigDecimal discount;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    
    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;
}