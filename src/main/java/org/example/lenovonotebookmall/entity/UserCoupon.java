package org.example.lenovonotebookmall.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_coupons")
public class UserCoupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;
    
    private Boolean isUsed = false;
    
    private LocalDateTime obtainTime = LocalDateTime.now();
    private LocalDateTime expiryTime;
    private LocalDateTime usedTime;

    @PrePersist
    public void calculateExpiry() {
        if (coupon != null && coupon.getValidHours() != null) {
            expiryTime = obtainTime.plusHours(coupon.getValidHours());
        }
    }
}