package org.example.lenovonotebookmall.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.service.UserService;
import org.example.lenovonotebookmall.service.VipService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/vip")
@RequiredArgsConstructor
public class VipController {
    private final UserService userService;
    private final VipService vipService;
    
    @GetMapping("/info")
    public ApiResponse<VipInfo> getVipInfo(Authentication auth) {
        User user = userService.getUserProfile(auth.getName());
        
        VipInfo info = new VipInfo();
        info.setVipLevel(user.getVipLevel());
        info.setTotalSpent(user.getTotalSpent());
        info.setVipExperience(user.getVipExperience());
        info.setVipPoints(user.getVipPoints());
        info.setDiscount(vipService.getVipDiscount(user.getVipLevel()));
        info.setNextLevelExp(vipService.getNextLevelExp(user.getVipLevel()));
        info.setRemainingDiscounts(vipService.getRemainingDiscounts(user.getId(), user.getVipLevel()));
        info.setCanUseDiscount(vipService.canUseDiscount(user.getId(), user.getVipLevel()));

        return ApiResponse.success(info);
    }
    
    @Data
    public static class VipInfo {
        private Integer vipLevel;
        private BigDecimal totalSpent;
        private Integer vipExperience;
        private Integer vipPoints;
        private BigDecimal discount;
        private Integer nextLevelExp;
        private Integer remainingDiscounts;
        private Boolean canUseDiscount;
    }
}