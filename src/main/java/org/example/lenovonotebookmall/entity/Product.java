package org.example.lenovonotebookmall.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String model;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private BigDecimal price;
    
    private String category;

    private String cpu;
    private String memory;
    private String storage;
    private String display;
    private String graphics;
    
    @Column(length = 1000)
    private String description;
    
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    private Integer stock = 0;
    private Integer sales = 0;
}