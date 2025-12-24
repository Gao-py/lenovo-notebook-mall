package org.example.lenovonotebookmall.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.ApiResponse;
import org.example.lenovonotebookmall.entity.ChatMessage;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.example.lenovonotebookmall.service.ChatService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final UserRepository userRepository;
    
    @PostMapping("/send")
    public ApiResponse<ChatMessage> sendMessage(Authentication auth, @RequestBody MessageRequest request) {
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        ChatMessage message = chatService.sendMessage(user.getId(), request.getReceiverId(), request.getContent());
        return ApiResponse.success(message);
    }
    
    @GetMapping("/history")
    public ApiResponse<List<ChatMessage>> getHistory(Authentication auth, @RequestParam Long otherId) {
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        List<ChatMessage> messages = chatService.getChatHistory(user.getId(), otherId);
        return ApiResponse.success(messages);
    }
    
    @GetMapping("/customers")
    public ApiResponse<List<User>> getCustomers(Authentication auth) {
        User admin = userRepository.findByUsername(auth.getName()).orElseThrow();
        List<User> customers = chatService.getAssignedCustomers(admin.getId());
        customers.forEach(c -> c.setPassword(null));
        return ApiResponse.success(customers);
    }

    @PostMapping("/read")
    public ApiResponse<Void> markAsRead(Authentication auth) {
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        chatService.markAsRead(user.getId());
        return ApiResponse.success(null);
    }
    
    @GetMapping("/unread")
    public ApiResponse<Long> getUnreadCount(Authentication auth) {
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ApiResponse.success(chatService.getUnreadCount(user.getId()));
    }
    
    @Data
    static class MessageRequest {
        private Long receiverId;
        private String content;
    }
}