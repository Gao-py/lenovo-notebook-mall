package org.example.lenovonotebookmall.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "order_ratings")
public class OrderRating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "order_item_id", unique = true)
    private OrderItem orderItem;
    
    @Column(nullable = false)
    private Integer rating;
    
    @Column(length = 500)
    private String comment;
    
    @Column(columnDefinition = "LONGTEXT")
    private String images;

    private LocalDateTime createTime = LocalDateTime.now();
}