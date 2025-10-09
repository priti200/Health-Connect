package com.healthconnect.repository;

import com.healthconnect.entity.UserPresence;
import com.healthconnect.entity.UserPresence.PresenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserPresenceRepository extends JpaRepository<UserPresence, Long> {

    Optional<UserPresence> findByUserId(Long userId);

    List<UserPresence> findByStatus(PresenceStatus status);

    @Query("SELECT up FROM UserPresence up WHERE up.status IN :statuses")
    List<UserPresence> findByStatusIn(@Param("statuses") List<PresenceStatus> statuses);

    @Query("SELECT up FROM UserPresence up WHERE up.isTyping = true AND up.typingInChatId = :chatId")
    List<UserPresence> findTypingUsersInChat(@Param("chatId") Long chatId);

    @Query("SELECT up FROM UserPresence up WHERE up.lastActivity > :since")
    List<UserPresence> findRecentlyActiveUsers(@Param("since") LocalDateTime since);

    @Modifying
    @Query("UPDATE UserPresence up SET up.status = :status, up.lastSeen = :lastSeen WHERE up.user.id = :userId")
    void updateUserStatus(@Param("userId") Long userId, 
                         @Param("status") PresenceStatus status, 
                         @Param("lastSeen") LocalDateTime lastSeen);

    @Modifying
    @Query("UPDATE UserPresence up SET up.isTyping = :isTyping, up.typingInChatId = :chatId, up.typingStartedAt = :startedAt WHERE up.user.id = :userId")
    void updateTypingStatus(@Param("userId") Long userId, 
                           @Param("isTyping") Boolean isTyping, 
                           @Param("chatId") Long chatId, 
                           @Param("startedAt") LocalDateTime startedAt);

    @Modifying
    @Query("UPDATE UserPresence up SET up.status = 'OFFLINE', up.lastSeen = :lastSeen WHERE up.lastActivity < :cutoffTime")
    void markInactiveUsersOffline(@Param("cutoffTime") LocalDateTime cutoffTime, 
                                 @Param("lastSeen") LocalDateTime lastSeen);

    @Query("SELECT COUNT(up) FROM UserPresence up WHERE up.status IN ('ONLINE', 'BUSY', 'AWAY')")
    long countOnlineUsers();

    @Query("SELECT up FROM UserPresence up JOIN Chat c ON (c.patient.id = up.user.id OR c.doctor.id = up.user.id) WHERE c.id = :chatId AND up.user.id != :excludeUserId")
    List<UserPresence> findChatParticipantsPresence(@Param("chatId") Long chatId, @Param("excludeUserId") Long excludeUserId);
}
