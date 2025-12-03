package org.example.lenovonotebookmall.repository;

import org.example.lenovonotebookmall.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    List<Promotion> findByStartTimeBeforeAndEndTimeAfter(LocalDateTime now1, LocalDateTime now2);
}