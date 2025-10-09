package com.healthconnect.controller;

import com.healthconnect.dto.MessageRequest;
import com.healthconnect.dto.MessageResponse;
import com.healthconnect.service.ChatService;
import com.healthconnect.service.JwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
@Slf4j
public class WebSocketController {

    private final ChatService chatService;
    private SimpMessagingTemplate messagingTemplate;
    private final JwtService jwtService;

    public WebSocketController(ChatService chatService, JwtService jwtService) {
        this.chatService = chatService;
        this.jwtService = jwtService;
    }

    @Autowired(required = false)
    public void setMessagingTemplate(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/test")
    public void test(String message, @Header("Authorization") String authHeader) {
        try {
            // Extract user info from JWT token for testing
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            String userEmail = jwtService.extractUsername(token);
            Long userId = jwtService.extractUserId(token);

            log.info("Received test message from user {}: {}", userEmail, message);

            if (messagingTemplate != null) {
                String response = String.format("Echo from %s (ID: %d): %s", userEmail, userId, message);
                messagingTemplate.convertAndSend("/topic/test", response);
                log.info("Test response sent: {}", response);
            }
        } catch (Exception e) {
            log.error("Error processing test message: {}", e.getMessage());
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/test", "Error: " + e.getMessage());
            }
        }
    }
    
    @MessageMapping("/chat/{chatId}/send")
    public void sendMessage(
            @DestinationVariable Long chatId,
            @Payload MessageRequest request,
            @Header("Authorization") String authHeader) {
        try {
            // Extract user ID from JWT token
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            String userEmail = jwtService.extractUsername(token);
            Long senderId = jwtService.extractUserId(token);

            log.info("WebSocket message received - chatId: {}, senderId: {}, userEmail: {}, content: {}",
                    chatId, senderId, userEmail, request.getContent());

            // Send message through chat service
            MessageResponse message = chatService.sendMessage(chatId, request.getContent(), senderId);

            // Broadcast message to all users in the chat
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend(
                    "/topic/chat/" + chatId,
                    message
                );
            }

            log.info("Message sent successfully: {}", message.getId());

        } catch (Exception e) {
            log.error("Failed to send message: {}", e.getMessage());
            // Send error message back to sender
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSendToUser(
                    jwtService.extractUsername(authHeader.substring(7)),
                    "/queue/errors",
                    "Failed to send message: " + e.getMessage()
                );
            }
        }
    }
    
    @MessageMapping("/chat/{chatId}/typing")
    public void handleTyping(
            @DestinationVariable Long chatId,
            @Payload String typingStatus,
            @Header("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.extractUsername(token);
            Long userId = jwtService.extractUserId(token);
            
            // Broadcast typing status to other participants
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend(
                    "/topic/chat/" + chatId + "/typing",
                    new TypingNotification(userId, userEmail, typingStatus)
                );
            }
            
        } catch (Exception e) {
            log.error("Failed to handle typing notification: {}", e.getMessage());
        }
    }

    // WebRTC Signaling for Video Calls
    @MessageMapping("/video/{roomId}/signal")
    public void handleVideoSignal(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> signal,
            @Header("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.extractUsername(token);
            Long userId = jwtService.extractUserId(token);

            log.info("WebRTC signal received - roomId: {}, userId: {}, type: {}",
                    roomId, userId, signal.get("type"));

            // Add sender info to signal
            signal.put("senderId", userId);
            signal.put("senderEmail", userEmail);

            // Broadcast signal to all participants in the room
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/video/" + roomId, signal);
            }

        } catch (Exception e) {
            log.error("Failed to handle video signal: {}", e.getMessage());
        }
    }

    @MessageMapping("/video/{roomId}/join")
    public void handleVideoJoin(
            @DestinationVariable String roomId,
            @Header("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.extractUsername(token);
            Long userId = jwtService.extractUserId(token);

            log.info("User joining video room - roomId: {}, userId: {}, email: {}",
                    roomId, userId, userEmail);

            Map<String, Object> joinMessage = new HashMap<>();
            joinMessage.put("type", "user-joined");
            joinMessage.put("userId", userId);
            joinMessage.put("userEmail", userEmail);

            // Notify other participants
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/video/" + roomId, joinMessage);
            }

        } catch (Exception e) {
            log.error("Failed to handle video join: {}", e.getMessage());
        }
    }

    @MessageMapping("/video/{roomId}/leave")
    public void handleVideoLeave(
            @DestinationVariable String roomId,
            @Header("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.extractUsername(token);
            Long userId = jwtService.extractUserId(token);

            log.info("User leaving video room - roomId: {}, userId: {}", roomId, userId);

            Map<String, Object> leaveMessage = new HashMap<>();
            leaveMessage.put("type", "user-left");
            leaveMessage.put("userId", userId);
            leaveMessage.put("userEmail", userEmail);

            // Notify other participants
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/video/" + roomId, leaveMessage);
            }

        } catch (Exception e) {
            log.error("Failed to handle video leave: {}", e.getMessage());
        }
    }

    // Inner class for typing notifications
    public static class TypingNotification {
        private Long userId;
        private String userEmail;
        private String status; // "typing" or "stopped"

        public TypingNotification(Long userId, String userEmail, String status) {
            this.userId = userId;
            this.userEmail = userEmail;
            this.status = status;
        }

        // Getters
        public Long getUserId() { return userId; }
        public String getUserEmail() { return userEmail; }
        public String getStatus() { return status; }
    }
}
