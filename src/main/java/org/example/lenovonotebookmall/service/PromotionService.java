package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.Product;
import org.example.lenovonotebookmall.entity.Promotion;
import org.example.lenovonotebookmall.repository.PromotionRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PromotionService {
    private final PromotionRepository promotionRepository;

    public BigDecimal calculateProductDiscount(Product product, BigDecimal originalPrice) {
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> promotions = promotionRepository.findByStartTimeBeforeAndEndTimeAfter(now, now);

        BigDecimal bestPrice = originalPrice;

        for (Promotion p : promotions) {
            if (p.getType() == Promotion.PromotionType.FULL_REDUCTION) {
                continue;
            }

            if (p.getProduct() != null && p.getProduct().getId().equals(product.getId())) {
                bestPrice = bestPrice.min(applyDiscount(p, originalPrice));
            } else if (p.getCategory() != null && p.getCategory().equals(product.getCategory())) {
                bestPrice = bestPrice.min(applyDiscount(p, originalPrice));
            }
        }

        return bestPrice;
    }

    public BigDecimal applyCartFullReduction(BigDecimal cartTotal) {
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> promotions = promotionRepository.findByStartTimeBeforeAndEndTimeAfter(now, now);

        BigDecimal bestTotal = cartTotal;

        for (Promotion p : promotions) {
            if (p.getType() == Promotion.PromotionType.FULL_REDUCTION &&
                    p.getProduct() == null && p.getCategory() == null) {
                if (cartTotal.compareTo(p.getMinAmount()) >= 0) {
                    bestTotal = bestTotal.min(cartTotal.subtract(p.getDiscountAmount()));
                }
            }
        }

        return bestTotal;
    }
    
    private BigDecimal applyDiscount(Promotion promotion, BigDecimal price) {
        if (promotion.getType() == Promotion.PromotionType.DISCOUNT ||
            promotion.getType() == Promotion.PromotionType.CATEGORY_DISCOUNT) {
            return price.multiply(promotion.getDiscountPercent())
                       .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        return price;
    }

    public List<Promotion> getActivePromotions() {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findByStartTimeBeforeAndEndTimeAfter(now, now);
    }

    public Promotion savePromotion(Promotion promotion) {
        return promotionRepository.save(promotion);
    }

    public void deletePromotion(Long id) {
        promotionRepository.deleteById(id);
    }
}