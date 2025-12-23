package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class VipService {
    private final UserRepository userRepository;
    
    private static final BigDecimal[] VIP_THRESHOLDS = {
        new BigDecimal("10000"),  // 1级
        new BigDecimal("20000"),  // 2级
        new BigDecimal("30000"),  // 3级
        new BigDecimal("50000"),  // 4级
        new BigDecimal("80000"),  // 5级
        new BigDecimal("130000")  // 6级
    };
    
    public void updateVipLevel(String username, BigDecimal orderAmount) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        user.setTotalSpent(user.getTotalSpent().add(orderAmount));
        
        int newLevel = 0;
        for (int i = 0; i < VIP_THRESHOLDS.length; i++) {
            if (user.getTotalSpent().compareTo(VIP_THRESHOLDS[i]) >= 0) {
                newLevel = i + 1;
            } else {
                break;
            }
        }
        
        user.setVipLevel(newLevel);
        user.setIsVip(newLevel > 0);
        userRepository.save(user);
    }
    
    public BigDecimal getVipDiscount(Integer vipLevel) {
        if (vipLevel == null || vipLevel <= 0) {
            return BigDecimal.ONE;
        }
        return BigDecimal.valueOf(100 - vipLevel).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
    }
    
    public BigDecimal getNextLevelThreshold(Integer currentLevel) {
        if (currentLevel == null || currentLevel >= VIP_THRESHOLDS.length) {
            return null;
        }
        return VIP_THRESHOLDS[currentLevel];
    }
}