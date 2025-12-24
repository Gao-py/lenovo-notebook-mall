package org.example.lenovonotebookmall.repository;

import org.example.lenovonotebookmall.entity.UserCoupon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserCouponRepository extends JpaRepository<UserCoupon, Long> {
    List<UserCoupon> findByUserIdAndIsUsed(Long userId, Boolean isUsed);
}