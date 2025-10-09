package com.healthconnect.controller;

import com.healthconnect.dto.*;
import com.healthconnect.entity.User;
import com.healthconnect.service.AiHealthBotService;
import com.healthconnect.service.SymptomAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai-health-bot")
@RequiredArgsConstructor
// CORS disabled - removed @CrossOrigin annotation
@Slf4j
public class AiHealthBotController {

    private final AiHealthBotService aiHealthBotService;
    private final SymptomAnalysisService symptomAnalysisService;
    
    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> sendMessage(
            @Valid @RequestBody AiChatRequest request,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        log.info("AI chat request from user: {}", currentUser.getEmail());
        
        try {
            AiChatResponse response = aiHealthBotService.sendMessage(currentUser.getId(), request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing AI chat request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/conversations")
    public ResponseEntity<List<AiConversationResponse>> getUserConversations(
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            List<AiConversationResponse> conversations = aiHealthBotService.getUserConversations(currentUser.getId());
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            log.error("Error fetching user conversations: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/conversations/paginated")
    public ResponseEntity<Page<AiConversationResponse>> getUserConversationsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AiConversationResponse> conversations = aiHealthBotService.getUserConversations(currentUser.getId(), pageable);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            log.error("Error fetching paginated conversations: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<AiConversationResponse> getConversationDetails(
            @PathVariable Long conversationId,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            AiConversationResponse conversation = aiHealthBotService.getConversationDetails(currentUser.getId(), conversationId);
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            log.error("Error fetching conversation details: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/analyze-symptoms")
    public ResponseEntity<?> analyzeSymptoms(
            @RequestBody String symptoms,
            Authentication authentication) {

        User currentUser = (User) authentication.getPrincipal();
        log.info("Symptom analysis request from user: {}", currentUser.getEmail());

        try {
            // For now, we'll create a temporary conversation context
            // In a full implementation, this could be linked to an existing conversation
            var analysisResult = symptomAnalysisService.analyzeSymptoms(symptoms, currentUser, null);
            return ResponseEntity.ok(analysisResult);
        } catch (Exception e) {
            log.error("Error analyzing symptoms: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error analyzing symptoms: " + e.getMessage());
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("AI Health Bot service is running with enhanced symptom analysis");
    }
}
