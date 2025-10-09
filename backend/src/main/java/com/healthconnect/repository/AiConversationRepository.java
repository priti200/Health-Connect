package com.healthconnect.repository;

import com.healthconnect.entity.AiConversation;
import com.healthconnect.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {
    
    List<AiConversation> findByUserAndIsActiveTrueOrderByUpdatedAtDesc(User user);
    
    Page<AiConversation> findByUserAndIsActiveTrueOrderByUpdatedAtDesc(User user, Pageable pageable);
    
    List<AiConversation> findByUserAndConversationTypeAndIsActiveTrueOrderByUpdatedAtDesc(
            User user, AiConversation.ConversationType conversationType);
    
    Optional<AiConversation> findByIdAndUserAndIsActiveTrue(Long id, User user);
    
    @Query("SELECT ac FROM AiConversation ac WHERE ac.user = :user AND ac.isActive = true AND ac.createdAt >= :since ORDER BY ac.updatedAt DESC")
    List<AiConversation> findRecentConversations(@Param("user") User user, @Param("since") LocalDateTime since);
    
    @Query("SELECT ac FROM AiConversation ac WHERE ac.isSharedWithDoctor = true AND ac.sharedWithDoctorId = :doctorId ORDER BY ac.sharedAt DESC")
    List<AiConversation> findSharedConversationsForDoctor(@Param("doctorId") Long doctorId);
    
    Long countByUserAndIsActiveTrue(User user);
    
    @Query("SELECT COUNT(ac) FROM AiConversation ac WHERE ac.user = :user AND ac.isActive = true AND ac.createdAt >= :since")
    Long countRecentConversations(@Param("user") User user, @Param("since") LocalDateTime since);
}
