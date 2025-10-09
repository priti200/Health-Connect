package com.healthconnect.repository;

import com.healthconnect.entity.Chat;
import com.healthconnect.entity.Message;
import com.healthconnect.entity.MessageStatus;
import com.healthconnect.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    Page<Message> findByChatOrderByCreatedAtDesc(Chat chat, Pageable pageable);
    
    List<Message> findByChatOrderByCreatedAtAsc(Chat chat);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.chat = :chat AND m.sender != :user AND m.status != :status")
    Integer countUnreadMessages(@Param("chat") Chat chat, @Param("user") User user, @Param("status") MessageStatus status);
    
    @Modifying
    @Query("UPDATE Message m SET m.status = :status, m.readAt = CURRENT_TIMESTAMP WHERE m.chat = :chat AND m.sender != :user AND m.status != :status")
    void markMessagesAsRead(@Param("chat") Chat chat, @Param("user") User user, @Param("status") MessageStatus status);
    
    @Query("SELECT m FROM Message m WHERE m.chat = :chat ORDER BY m.createdAt DESC LIMIT 1")
    Message findLastMessageByChat(@Param("chat") Chat chat);
}
