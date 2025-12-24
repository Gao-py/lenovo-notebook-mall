package org.example.lenovonotebookmall.repository;

import org.example.lenovonotebookmall.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
}