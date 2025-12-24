package org.example.lenovonotebookmall.repository;

import org.example.lenovonotebookmall.entity.VipDiscountUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;

public interface VipDiscountUsageRepository extends JpaRepository<VipDiscountUsage, Long> {
    long countByUserIdAndUsageDate(Long userId, LocalDate usageDate);
}