package com.healthconnect.controller;

import com.healthconnect.dto.MessageResponse;
import com.healthconnect.service.ChatService;
import com.healthconnect.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
@Slf4j
// CORS disabled - removed @CrossOrigin annotation
public class FileUploadController {

    private final ChatService chatService;
    private final JwtService jwtService;

    @PostMapping("/{chatId}/messages/attachment")
    public ResponseEntity<?> sendMessageWithAttachment(
            @PathVariable Long chatId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "content", required = false) String content,
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            // Extract user ID from JWT token
            String token = authHeader.substring(7);
            Long userId = jwtService.extractUserId(token);
            
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("File is empty"));
            }
            
            // Send message with attachment
            MessageResponse response = chatService.sendMessageWithAttachment(chatId, content, userId, file);
            
            log.info("File uploaded successfully: chatId={}, userId={}, filename={}", 
                    chatId, userId, file.getOriginalFilename());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Invalid file upload request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new ErrorResponse(e.getMessage()));
                
        } catch (Exception e) {
            log.error("Failed to upload file: chatId={}, error={}", chatId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to upload file: " + e.getMessage()));
        }
    }

    @PostMapping("/{chatId}/messages/reply")
    public ResponseEntity<?> replyToMessage(
            @PathVariable Long chatId,
            @RequestBody ReplyMessageRequest request,
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            // Extract user ID from JWT token
            String token = authHeader.substring(7);
            Long userId = jwtService.extractUserId(token);
            
            // Validate request
            if (request.getContent() == null || request.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Message content is required"));
            }
            
            if (request.getReplyToMessageId() == null) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Reply to message ID is required"));
            }
            
            // Send reply message
            MessageResponse response = chatService.replyToMessage(
                chatId, 
                request.getContent().trim(), 
                userId, 
                request.getReplyToMessageId()
            );
            
            log.info("Reply message sent: chatId={}, userId={}, replyToMessageId={}", 
                    chatId, userId, request.getReplyToMessageId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to send reply message: chatId={}, error={}", chatId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to send reply message: " + e.getMessage()));
        }
    }

    // DTOs
    public static class ReplyMessageRequest {
        private String content;
        private Long replyToMessageId;
        
        // Getters and setters
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public Long getReplyToMessageId() { return replyToMessageId; }
        public void setReplyToMessageId(Long replyToMessageId) { this.replyToMessageId = replyToMessageId; }
    }

    public static class ErrorResponse {
        private String error;
        private long timestamp;
        
        public ErrorResponse(String error) {
            this.error = error;
            this.timestamp = System.currentTimeMillis();
        }
        
        // Getters
        public String getError() { return error; }
        public long getTimestamp() { return timestamp; }
    }
}
