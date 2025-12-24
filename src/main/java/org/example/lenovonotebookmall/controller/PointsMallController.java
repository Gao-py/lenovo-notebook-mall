package org.example.lenovonotebookmall.controller;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.entity.Coupon;
import org.example.lenovonotebookmall.entity.UserCoupon;
import org.example.lenovonotebookmall.service.PointsMallService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/points-mall")
@RequiredArgsConstructor
public class PointsMallController {
    private final PointsMallService pointsMallService;
    
    @GetMapping("/coupons")
    public ApiResponse<List<Coupon>> getAllCoupons() {
        return ApiResponse.success(pointsMallService.getAllCoupons());
    }
    
    @PostMapping("/exchange/{couponId}")
    public ApiResponse<Void> exchangeCoupon(Authentication auth, @PathVariable Long couponId) {
        try {
            pointsMallService.exchangeCoupon(auth.getName(), couponId);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @GetMapping("/my-coupons")
    public ApiResponse<List<UserCoupon>> getMyCoupons(Authentication auth) {
        return ApiResponse.success(pointsMallService.getUserCoupons(auth.getName()));
    }

    @PostMapping("/admin/coupons")
    public ApiResponse<Coupon> addCoupon(@RequestBody Coupon coupon) {
        return ApiResponse.success(pointsMallService.saveCoupon(coupon));
    }

    @PutMapping("/admin/coupons/{id}")
    public ApiResponse<Coupon> updateCoupon(@PathVariable Long id, @RequestBody Coupon coupon) {
        coupon.setId(id);
        return ApiResponse.success(pointsMallService.saveCoupon(coupon));
    }

    @DeleteMapping("/admin/coupons/{id}")
    public ApiResponse<Void> deleteCoupon(@PathVariable Long id) {
        pointsMallService.deleteCoupon(id);
        return ApiResponse.success(null);
    }
}