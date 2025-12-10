package org.example.lenovonotebookmall.controller;

import lombok.Data;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.util.CaptchaUtil;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/captcha")
public class CaptchaController {
    private static final Map<String, String> captchaStore = new ConcurrentHashMap<>();
    
    @GetMapping("/generate")
    public ApiResponse<CaptchaResponse> generate() {
        CaptchaUtil.CaptchaResult result = CaptchaUtil.generate();
        String key = UUID.randomUUID().toString();
        captchaStore.put(key, result.code);
        
        new Thread(() -> {
            try {
                Thread.sleep(300000);
                captchaStore.remove(key);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
        
        return ApiResponse.success(new CaptchaResponse(key, result.image));
    }
    
    public static boolean verify(String key, String code) {
        String stored = captchaStore.get(key);
        if (stored != null && stored.equalsIgnoreCase(code)) {
            captchaStore.remove(key);
            return true;
        }
        return false;
    }
    
    @Data
    public static class CaptchaResponse {
        private String key;
        private String image;
        
        public CaptchaResponse(String key, String image) {
            this.key = key;
            this.image = image;
        }
    }
}