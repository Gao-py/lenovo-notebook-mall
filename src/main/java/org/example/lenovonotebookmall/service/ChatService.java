package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.ChatMessage;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.ChatMessageRepository;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatMessageRepository chatRepository;
    private final UserRepository userRepository;
    
    public ChatMessage sendMessage(Long senderId, Long receiverId, String content) {
        ChatMessage message = new ChatMessage();
        message.setSenderId(senderId);
        message.setReceiverId(receiverId);
        message.setContent(content);
        return chatRepository.save(message);
    }
    
    public List<ChatMessage> getChatHistory(Long userId1, Long userId2) {
        return chatRepository.findChatHistory(userId1, userId2);
    }
    
    @Transactional
    public void markAsRead(Long userId) {
        List<ChatMessage> messages = chatRepository.findAll().stream()
            .filter(m -> m.getReceiverId().equals(userId) && !m.getIsRead())
            .toList();
        messages.forEach(m -> m.setIsRead(true));
        chatRepository.saveAll(messages);
    }
    
    public Long getUnreadCount(Long userId) {
        return chatRepository.countUnreadMessages(userId);
    }
    
    public List<User> getAssignedCustomers(Long adminId) {
        return userRepository.findAll().stream()
            .filter(u -> adminId.equals(u.getAssignedAdminId()))
            .collect(Collectors.toList());
    }
}