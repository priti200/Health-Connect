package com.healthconnect.controller;

import com.healthconnect.dto.*;
import com.healthconnect.entity.User;
import com.healthconnect.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ChatController {
    
    private final ChatService chatService;
    
    @PostMapping
    public ResponseEntity<ChatResponse> createOrGetChat(
            @Valid @RequestBody ChatRequest request,
            Authentication authentication) {

        try {
            System.out.println("=== Chat Creation Request ===");
            System.out.println("Authentication: " + authentication);
            System.out.println("User: " + (authentication != null ? authentication.getName() : "null"));
            System.out.println("Request: " + request);
            System.out.println("Participant ID: " + request.getParticipantId());

            if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
                System.out.println("ERROR: Invalid authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            User currentUser = (User) authentication.getPrincipal();
            System.out.println("Current User ID: " + currentUser.getId());
            System.out.println("Current User Role: " + currentUser.getRole());

            if (request == null || request.getParticipantId() == null) {
                System.out.println("ERROR: Request or Participant ID is null");
                return ResponseEntity.badRequest().build();
            }

            if (currentUser.getId().equals(request.getParticipantId())) {
                System.out.println("ERROR: Cannot create chat with yourself");
                return ResponseEntity.badRequest().build();
            }

            ChatResponse chat = chatService.createOrGetChat(currentUser.getId(), request.getParticipantId());

            System.out.println("Chat created/retrieved: " + chat.getId());
            System.out.println("=== End Chat Creation ===");

            return ResponseEntity.ok(chat);
        } catch (Exception e) {
            System.out.println("ERROR in createOrGetChat: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> createOrGetAppointmentChat(
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentChatRequest request,
            Authentication authentication) {
        try {
            log.info("Creating appointment chat - appointmentId: {}, request: {}", appointmentId, request);

            if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
                log.error("Invalid authentication for appointment chat creation");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
            }

            User currentUser = (User) authentication.getPrincipal();
            log.info("Current user: {} (ID: {})", currentUser.getEmail(), currentUser.getId());

            if (request == null || request.getParticipantId() == null) {
                log.error("Invalid request - missing participant ID");
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Participant ID is required"));
            }

            ChatResponse chat = chatService.createOrGetChat(
                    currentUser.getId(),
                    request.getParticipantId(),
                    appointmentId,
                    request.getChatType(),
                    request.getSubject()
            );

            log.info("Appointment chat created successfully: {}", chat.getId());
            return ResponseEntity.ok(chat);

        } catch (RuntimeException e) {
            log.error("Error creating appointment chat: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating appointment chat: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error"));
        }
    }
    
    @GetMapping
    public ResponseEntity<List<ChatResponse>> getUserChats(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<ChatResponse> chats = chatService.getUserChats(currentUser.getId());
        return ResponseEntity.ok(chats);
    }
    
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<?> getChatMessages(
            @PathVariable Long chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            List<MessageResponse> messages = chatService.getChatMessages(chatId, currentUser.getId(), page, size);
            return ResponseEntity.ok(messages);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{chatId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long chatId,
            @Valid @RequestBody MessageRequest request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        MessageResponse message = chatService.sendMessage(chatId, request.getContent(), currentUser.getId());
        return ResponseEntity.ok(message);
    }
    
    @PutMapping("/{chatId}/read")
    public ResponseEntity<Void> markMessagesAsRead(
            @PathVariable Long chatId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        chatService.markMessagesAsRead(chatId, currentUser.getId());
        return ResponseEntity.ok().build();
    }
}
