package com.healthconnect.service;

import com.healthconnect.dto.*;
import com.healthconnect.entity.*;
import com.healthconnect.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AiHealthBotService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final GeminiApiService geminiApiService;
    
    public AiChatResponse sendMessage(Long userId, AiChatRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        AiConversation conversation;
        
        if (request.isNewConversation() || request.getConversationId() == null) {
            // Create new conversation
            conversation = createNewConversation(user, request);
        } else {
            // Use existing conversation
            conversation = conversationRepository.findByIdAndUserAndIsActiveTrue(request.getConversationId(), user)
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));
        }
        
        // Save user message
        AiMessage userMessage = AiMessage.builder()
                .conversation(conversation)
                .content(request.getMessage())
                .role(AiMessage.MessageRole.USER)
                .build();
        messageRepository.save(userMessage);
        
        // Get AI response
        String aiResponse = getAiResponse(request.getMessage(), conversation);
        
        // Save AI message
        AiMessage aiMessage = AiMessage.builder()
                .conversation(conversation)
                .content(aiResponse)
                .role(AiMessage.MessageRole.ASSISTANT)
                .build();
        messageRepository.save(aiMessage);
        
        // Update conversation
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        
        return AiChatResponse.builder()
                .conversationId(conversation.getId())
                .conversationTitle(conversation.getTitle())
                .conversationType(conversation.getConversationType())
                .userMessage(request.getMessage())
                .aiResponse(aiResponse)
                .timestamp(LocalDateTime.now())
                .isNewConversation(request.isNewConversation())
                .build();
    }
    
    private AiConversation createNewConversation(User user, AiChatRequest request) {
        String title = request.getConversationTitle();
        if (title == null || title.trim().isEmpty()) {
            title = generateConversationTitle(request.getMessage());
        }
        
        AiConversation conversation = AiConversation.builder()
                .user(user)
                .title(title)
                .conversationType(request.getConversationType())
                .build();
        
        return conversationRepository.save(conversation);
    }
    
    private String generateConversationTitle(String firstMessage) {
        // Generate a title based on the first message (simplified)
        String title = firstMessage.length() > 50 ? 
                firstMessage.substring(0, 47) + "..." : firstMessage;
        return title.replaceAll("[^a-zA-Z0-9\\s]", "").trim();
    }
    
    private String getAiResponse(String userMessage, AiConversation conversation) {
        try {
            // Get conversation context
            List<AiMessage> recentMessages = messageRepository
                    .findByConversationAndIsActiveTrueOrderByTimestampAsc(conversation)
                    .stream()
                    .limit(10) // Last 10 messages for context
                    .collect(Collectors.toList());
            
            // Build context for AI
            StringBuilder contextBuilder = new StringBuilder();
            contextBuilder.append("You are HealthConnect AI, a helpful medical assistant. ");
            contextBuilder.append("Provide helpful health information but always remind users to consult healthcare professionals for serious concerns. ");
            contextBuilder.append("Be empathetic, accurate, and responsible in your responses.\n\n");
            
            // Add conversation history
            for (AiMessage msg : recentMessages) {
                contextBuilder.append(msg.getRole() == AiMessage.MessageRole.USER ? "User: " : "Assistant: ");
                contextBuilder.append(msg.getContent()).append("\n");
            }
            
            contextBuilder.append("User: ").append(userMessage).append("\n");
            contextBuilder.append("Assistant: ");
            
            // Use Gemini API service to generate response
            return geminiApiService.generateResponse(
                contextBuilder.toString(),
                conversation.getConversationType().toString()
            );
            
        } catch (Exception e) {
            log.error("Error getting AI response: {}", e.getMessage());
            return "I apologize, but I'm experiencing technical difficulties. Please try again later or consult with a healthcare professional if you have urgent concerns.";
        }
    }
    

    
    public List<AiConversationResponse> getUserConversations(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<AiConversation> conversations = conversationRepository
                .findByUserAndIsActiveTrueOrderByUpdatedAtDesc(user);
        
        return conversations.stream()
                .map(this::convertToConversationResponse)
                .collect(Collectors.toList());
    }
    
    public Page<AiConversationResponse> getUserConversations(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Page<AiConversation> conversations = conversationRepository
                .findByUserAndIsActiveTrueOrderByUpdatedAtDesc(user, pageable);
        
        return conversations.map(this::convertToConversationResponse);
    }
    
    public AiConversationResponse getConversationDetails(Long userId, Long conversationId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        AiConversation conversation = conversationRepository
                .findByIdAndUserAndIsActiveTrue(conversationId, user)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        List<AiMessage> messages = messageRepository
                .findByConversationAndIsActiveTrueOrderByTimestampAsc(conversation);
        
        AiConversationResponse response = convertToConversationResponse(conversation);
        response.setMessages(messages.stream()
                .map(this::convertToMessageResponse)
                .collect(Collectors.toList()));
        
        return response;
    }
    
    private AiConversationResponse convertToConversationResponse(AiConversation conversation) {
        AiMessage lastMessage = messageRepository.findLatestMessageByConversation(conversation);
        
        return AiConversationResponse.builder()
                .id(conversation.getId())
                .title(conversation.getTitle())
                .conversationType(conversation.getConversationType())
                .summary(conversation.getSummary())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .isSharedWithDoctor(conversation.getIsSharedWithDoctor())
                .sharedWithDoctorId(conversation.getSharedWithDoctorId())
                .sharedAt(conversation.getSharedAt())
                .messageCount(messageRepository.countByConversationAndIsActiveTrue(conversation).intValue())
                .lastMessage(lastMessage != null ? lastMessage.getContent() : null)
                .lastMessageTime(lastMessage != null ? lastMessage.getTimestamp() : null)
                .build();
    }
    
    private AiMessageResponse convertToMessageResponse(AiMessage message) {
        return AiMessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .role(message.getRole())
                .timestamp(message.getTimestamp())
                .metadata(message.getMetadata())
                .build();
    }
}
