package org.example.lenovonotebookmall.controller;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.entity.Promotion;
import org.example.lenovonotebookmall.service.PromotionService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PromotionController {
    private final PromotionService promotionService;
    
    @GetMapping("/promotions")
    public ApiResponse<List<Promotion>> getActivePromotions() {
        return ApiResponse.success(promotionService.getActivePromotions());
    }
    
    @PostMapping("/admin/promotions")
    public ApiResponse<Promotion> addPromotion(@RequestBody Promotion promotion) {
        return ApiResponse.success(promotionService.savePromotion(promotion));
    }
    
    @DeleteMapping("/admin/promotions/{id}")
    public ApiResponse<Void> deletePromotion(@PathVariable Long id) {
        promotionService.deletePromotion(id);
        return ApiResponse.success(null);
    }
}