package com.healthconnect.repository;

import com.healthconnect.entity.AiConversation;
import com.healthconnect.entity.AiMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {
    
    List<AiMessage> findByConversationAndIsActiveTrueOrderByTimestampAsc(AiConversation conversation);
    
    Page<AiMessage> findByConversationAndIsActiveTrueOrderByTimestampAsc(AiConversation conversation, Pageable pageable);
    
    @Query("SELECT am FROM AiMessage am WHERE am.conversation = :conversation AND am.isActive = true ORDER BY am.timestamp DESC")
    List<AiMessage> findByConversationOrderByTimestampDesc(@Param("conversation") AiConversation conversation);
    
    @Query("SELECT am FROM AiMessage am WHERE am.conversation = :conversation AND am.isActive = true ORDER BY am.timestamp DESC LIMIT 1")
    AiMessage findLatestMessageByConversation(@Param("conversation") AiConversation conversation);
    
    Long countByConversationAndIsActiveTrue(AiConversation conversation);
    
    void deleteByConversation(AiConversation conversation);
}
