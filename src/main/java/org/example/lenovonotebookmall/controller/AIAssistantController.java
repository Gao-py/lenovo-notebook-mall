package org.example.lenovonotebookmall.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.service.AIAssistantService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-assistant")
@RequiredArgsConstructor
public class AIAssistantController {
    private final AIAssistantService aiAssistantService;

    @PostMapping("/chat")
    public ApiResponse<String> chat(@RequestBody ChatRequest request) {
        try {
            String sessionId = request.getSessionId() != null ? request.getSessionId() : "default";
            String response = aiAssistantService.chat(request.getMessage(), sessionId);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error("AI助手暂时无法回答，请稍后再试");
        }
    }

    @PostMapping("/clear-history")
    public ApiResponse<Void> clearHistory(@RequestBody ClearHistoryRequest request) {
        try {
            String sessionId = request.getSessionId() != null ? request.getSessionId() : "default";
            aiAssistantService.clearHistory(sessionId);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error("清空历史失败");
        }
    }

    @Data
    static class ChatRequest {
        private String message;
        private String sessionId;
    }

    @Data
    static class ClearHistoryRequest {
        private String sessionId;
    }
}