package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.Coupon;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.entity.UserCoupon;
import org.example.lenovonotebookmall.repository.CouponRepository;
import org.example.lenovonotebookmall.repository.UserCouponRepository;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PointsMallService {
    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;
    private final UserRepository userRepository;
    
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }
    
    @Transactional
    public void exchangeCoupon(String username, Long couponId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new RuntimeException("优惠券不存在"));
        
        if (user.getVipPoints() < coupon.getPointsCost()) {
            throw new RuntimeException("积分不足");
        }
        
        if (coupon.getStock() != null && coupon.getStock() <= 0) {
            throw new RuntimeException("库存不足");
        }
        
        user.setVipPoints(user.getVipPoints() - coupon.getPointsCost());
        userRepository.save(user);
        
        if (coupon.getStock() != null) {
            coupon.setStock(coupon.getStock() - 1);
            couponRepository.save(coupon);
        }
        
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setUser(user);
        userCoupon.setCoupon(coupon);
        userCouponRepository.save(userCoupon);
    }
    
    public List<UserCoupon> getUserCoupons(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return userCouponRepository.findByUserIdAndIsUsed(user.getId(), false);
    }

    public Coupon saveCoupon(Coupon coupon) {
        return couponRepository.save(coupon);
    }

    public void deleteCoupon(Long id) {
        couponRepository.deleteById(id);
    }
}