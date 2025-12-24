package org.example.lenovonotebookmall.repository;

import org.example.lenovonotebookmall.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("SELECT m FROM ChatMessage m WHERE (m.senderId = ?1 AND m.receiverId = ?2) OR (m.senderId = ?2 AND m.receiverId = ?1) ORDER BY m.createTime")
    List<ChatMessage> findChatHistory(Long userId1, Long userId2);
    
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.receiverId = ?1 AND m.isRead = false")
    Long countUnreadMessages(Long userId);
}