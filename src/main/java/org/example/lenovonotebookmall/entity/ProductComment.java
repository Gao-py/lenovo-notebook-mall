package org.example.lenovonotebookmall.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "product_comments")
public class ProductComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long productId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    private Long parentId;

    private Long orderRatingId; // 关联订单评价ID
    
    private LocalDateTime createTime = LocalDateTime.now();
    
    @Transient
    private String username;

    @Transient
    private Integer rating; // 评分（仅顶级评论有）
}