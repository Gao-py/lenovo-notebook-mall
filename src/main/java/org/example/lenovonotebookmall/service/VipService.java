package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.entity.VipDiscountUsage;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.example.lenovonotebookmall.repository.VipDiscountUsageRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class VipService {
    private final UserRepository userRepository;
    private final VipDiscountUsageRepository usageRepository;

    private static final int[] VIP_EXP_THRESHOLDS = {
        3600, 9600, 30000, 75000, 200000, 600000
    };
    
    private static final int[] DAILY_DISCOUNT_LIMITS = {1, 2, 3, 5, 6, 8};

    public void updateVipLevel(String username, BigDecimal orderAmount) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        BigDecimal currentSpent = user.getTotalSpent() == null ? BigDecimal.ZERO : user.getTotalSpent();
        user.setTotalSpent(currentSpent.add(orderAmount));
        
        int currentLevel = user.getVipLevel() == null ? 0 : user.getVipLevel();
        double expRate = getExpRate(currentLevel);
        double pointsRate = getPointsRate(currentLevel);

        int expGain = (int)(orderAmount.doubleValue() * expRate);
        int pointsGain = (int)(orderAmount.doubleValue() / pointsRate);

        user.setVipExperience((user.getVipExperience() == null ? 0 : user.getVipExperience()) + expGain);
        user.setVipPoints((user.getVipPoints() == null ? 0 : user.getVipPoints()) + pointsGain);

        int newLevel = 0;
        for (int i = 0; i < VIP_EXP_THRESHOLDS.length; i++) {
            if (user.getVipExperience() >= VIP_EXP_THRESHOLDS[i]) {
                newLevel = i + 1;
            } else {
                break;
            }
        }
        
        user.setVipLevel(newLevel);
        user.setIsVip(newLevel > 0);
        userRepository.save(user);
    }
    
    private double getExpRate(int vipLevel) {
        if (vipLevel <= 2) return 1.2;
        if (vipLevel <= 4) return 1.5;
        return 2.0;
    }

    private double getPointsRate(int vipLevel) {
        if (vipLevel <= 2) return 10.0;
        if (vipLevel <= 4) return 8.0;
        return 5.0;
    }

    public BigDecimal getVipDiscount(Integer vipLevel) {
        if (vipLevel == null || vipLevel <= 0) {
            return BigDecimal.ONE;
        }
        int discount = switch(vipLevel) {
            case 1, 2, 3 -> 90;
            case 4 -> 88;
            case 5 -> 85;
            case 6 -> 82;
            default -> 100;
        };
        return BigDecimal.valueOf(discount).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
    }

    public boolean canUseDiscount(Long userId, Integer vipLevel) {
        if (vipLevel == null || vipLevel <= 0) return false;

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Shanghai"));
        long usedCount = usageRepository.countByUserIdAndUsageDate(userId, today);
        int limit = DAILY_DISCOUNT_LIMITS[vipLevel - 1];

        return usedCount < limit;
    }

    public void recordDiscountUsage(Long userId) {
        VipDiscountUsage usage = new VipDiscountUsage();
        usage.setUserId(userId);
        usage.setUsageDate(LocalDate.now(ZoneId.of("Asia/Shanghai")));
        usageRepository.save(usage);
    }

    public int getRemainingDiscounts(Long userId, Integer vipLevel) {
        if (vipLevel == null || vipLevel <= 0) return 0;

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Shanghai"));
        long usedCount = usageRepository.countByUserIdAndUsageDate(userId, today);
        int limit = DAILY_DISCOUNT_LIMITS[vipLevel - 1];

        return Math.max(0, limit - (int)usedCount);
    }
    
    public Integer getNextLevelExp(Integer currentLevel) {
        if (currentLevel == null || currentLevel >= VIP_EXP_THRESHOLDS.length) {
            return null;
        }
        return VIP_EXP_THRESHOLDS[currentLevel];
    }
}