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
        try {
            List<Coupon> coupons = pointsMallService.getAllCoupons();
            return ApiResponse.success(coupons);
        } catch (Exception e) {
            return ApiResponse.error("获取优惠券失败: " + e.getMessage());
        }
    }

    @PostMapping("/exchange/{couponId}")
    public ApiResponse<Void> exchangeCoupon(Authentication auth, @PathVariable Long couponId) {
        try {
            if (auth == null || auth.getName() == null) {
                return ApiResponse.error("请先登录");
            }

            pointsMallService.exchangeCoupon(auth.getName(), couponId);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/my-coupons")
    public ApiResponse<List<UserCoupon>> getMyCoupons(Authentication auth) {
        try {
            if (auth == null || auth.getName() == null) {
                return ApiResponse.error("请先登录");
            }

            List<UserCoupon> userCoupons = pointsMallService.getUserCoupons(auth.getName());
            return ApiResponse.success(userCoupons);
        } catch (Exception e) {
            return ApiResponse.error("获取我的优惠券失败: " + e.getMessage());
        }
    }

    @PostMapping("/admin/coupons")
    public ApiResponse<Coupon> addCoupon(@RequestBody Coupon coupon) {
        try {
            return ApiResponse.success(pointsMallService.saveCoupon(coupon));
        } catch (Exception e) {
            return ApiResponse.error("添加优惠券失败: " + e.getMessage());
        }
    }

    @PutMapping("/admin/coupons/{id}")
    public ApiResponse<Coupon> updateCoupon(@PathVariable Long id, @RequestBody Coupon coupon) {
        try {
            coupon.setId(id);
            return ApiResponse.success(pointsMallService.saveCoupon(coupon));
        } catch (Exception e) {
            return ApiResponse.error("更新优惠券失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/admin/coupons/{id}")
    public ApiResponse<Void> deleteCoupon(@PathVariable Long id) {
        try {
            pointsMallService.deleteCoupon(id);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error("删除优惠券失败: " + e.getMessage());
        }
    }
}