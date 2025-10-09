package com.healthconnect.service;

import com.healthconnect.entity.User;
import com.healthconnect.entity.UserPresence;
import com.healthconnect.entity.UserPresence.PresenceStatus;
import com.healthconnect.repository.UserPresenceRepository;
import com.healthconnect.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class UserPresenceService {

    private final UserPresenceRepository userPresenceRepository;
    private final UserRepository userRepository;
    private SimpMessagingTemplate messagingTemplate;

    public UserPresenceService(UserPresenceRepository userPresenceRepository, UserRepository userRepository) {
        this.userPresenceRepository = userPresenceRepository;
        this.userRepository = userRepository;
    }

    @Autowired(required = false)
    public void setMessagingTemplate(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public UserPresence updateUserPresence(Long userId, PresenceStatus status, String deviceInfo, String ipAddress) {
        UserPresence presence = userPresenceRepository.findByUserId(userId)
                .orElseGet(() -> createNewPresence(userId));

        presence.updatePresence(status);
        presence.setDeviceInfo(deviceInfo);
        presence.setIpAddress(ipAddress);

        UserPresence savedPresence = userPresenceRepository.save(presence);
        
        // Broadcast presence update to relevant users
        broadcastPresenceUpdate(savedPresence);
        
        log.info("Updated presence for user {} to {}", userId, status);
        return savedPresence;
    }

    @Transactional
    public void setUserOnline(Long userId, String deviceInfo, String ipAddress) {
        updateUserPresence(userId, PresenceStatus.ONLINE, deviceInfo, ipAddress);
    }

    @Transactional
    public void setUserOffline(Long userId) {
        UserPresence presence = userPresenceRepository.findByUserId(userId)
                .orElse(null);
        
        if (presence != null) {
            presence.updatePresence(PresenceStatus.OFFLINE);
            presence.stopTyping();
            UserPresence savedPresence = userPresenceRepository.save(presence);
            broadcastPresenceUpdate(savedPresence);
            log.info("Set user {} offline", userId);
        }
    }

    @Transactional
    public void startTyping(Long userId, Long chatId) {
        UserPresence presence = userPresenceRepository.findByUserId(userId)
                .orElseGet(() -> createNewPresence(userId));

        presence.startTyping(chatId);
        userPresenceRepository.save(presence);

        // Broadcast typing notification to chat participants
        broadcastTypingNotification(userId, chatId, true);
        log.debug("User {} started typing in chat {}", userId, chatId);
    }

    @Transactional
    public void stopTyping(Long userId, Long chatId) {
        UserPresence presence = userPresenceRepository.findByUserId(userId)
                .orElse(null);

        if (presence != null && presence.getIsTyping() && 
            chatId.equals(presence.getTypingInChatId())) {
            presence.stopTyping();
            userPresenceRepository.save(presence);

            // Broadcast typing stopped notification
            broadcastTypingNotification(userId, chatId, false);
            log.debug("User {} stopped typing in chat {}", userId, chatId);
        }
    }

    public Optional<UserPresence> getUserPresence(Long userId) {
        return userPresenceRepository.findByUserId(userId);
    }

    public List<UserPresence> getOnlineUsers() {
        return userPresenceRepository.findByStatusIn(
            List.of(PresenceStatus.ONLINE, PresenceStatus.BUSY, PresenceStatus.AWAY)
        );
    }

    public List<UserPresence> getTypingUsersInChat(Long chatId) {
        return userPresenceRepository.findTypingUsersInChat(chatId);
    }

    public List<UserPresence> getChatParticipantsPresence(Long chatId, Long excludeUserId) {
        return userPresenceRepository.findChatParticipantsPresence(chatId, excludeUserId);
    }

    public boolean isUserOnline(Long userId) {
        return userPresenceRepository.findByUserId(userId)
                .map(UserPresence::isOnline)
                .orElse(false);
    }

    public long getOnlineUserCount() {
        return userPresenceRepository.countOnlineUsers();
    }

    @Transactional
    public void updateActivity(Long userId) {
        UserPresence presence = userPresenceRepository.findByUserId(userId)
                .orElseGet(() -> createNewPresence(userId));

        presence.setLastActivity(LocalDateTime.now());
        userPresenceRepository.save(presence);
    }

    // Scheduled task to clean up inactive users (runs every 5 minutes)
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void cleanupInactiveUsers() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(10);
        LocalDateTime now = LocalDateTime.now();
        
        userPresenceRepository.markInactiveUsersOffline(cutoffTime, now);
        log.debug("Cleaned up inactive users");
    }

    // Scheduled task to clean up stale typing indicators (runs every minute)
    @Scheduled(fixedRate = 60000) // 1 minute
    @Transactional
    public void cleanupStaleTypingIndicators() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(2);
        
        List<UserPresence> staleTypingUsers = userPresenceRepository.findAll().stream()
                .filter(up -> up.getIsTyping() && 
                             up.getTypingStartedAt() != null && 
                             up.getTypingStartedAt().isBefore(cutoffTime))
                .toList();

        for (UserPresence presence : staleTypingUsers) {
            Long chatId = presence.getTypingInChatId();
            presence.stopTyping();
            userPresenceRepository.save(presence);
            
            if (chatId != null) {
                broadcastTypingNotification(presence.getUser().getId(), chatId, false);
            }
        }
        
        if (!staleTypingUsers.isEmpty()) {
            log.debug("Cleaned up {} stale typing indicators", staleTypingUsers.size());
        }
    }

    private UserPresence createNewPresence(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return UserPresence.builder()
                .user(user)
                .status(PresenceStatus.ONLINE)
                .lastSeen(LocalDateTime.now())
                .lastActivity(LocalDateTime.now())
                .isTyping(false)
                .build();
    }

    private void broadcastPresenceUpdate(UserPresence presence) {
        try {
            PresenceUpdateMessage message = new PresenceUpdateMessage(
                presence.getUser().getId(),
                presence.getUser().getFullName(),
                presence.getStatus().toString(),
                presence.getStatusMessage(),
                presence.getLastSeen()
            );

            // Broadcast to all users (in a real app, you might want to be more selective)
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/presence", message);
            }
        } catch (Exception e) {
            log.error("Failed to broadcast presence update for user {}: {}", 
                     presence.getUser().getId(), e.getMessage());
        }
    }

    private void broadcastTypingNotification(Long userId, Long chatId, boolean isTyping) {
        try {
            TypingNotificationMessage message = new TypingNotificationMessage(
                userId, chatId, isTyping, LocalDateTime.now()
            );

            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/typing", message);
            }
        } catch (Exception e) {
            log.error("Failed to broadcast typing notification for user {} in chat {}: {}", 
                     userId, chatId, e.getMessage());
        }
    }

    // DTOs for WebSocket messages
    public record PresenceUpdateMessage(
        Long userId,
        String userName,
        String status,
        String statusMessage,
        LocalDateTime lastSeen
    ) {}

    public record TypingNotificationMessage(
        Long userId,
        Long chatId,
        boolean isTyping,
        LocalDateTime timestamp
    ) {}
}
