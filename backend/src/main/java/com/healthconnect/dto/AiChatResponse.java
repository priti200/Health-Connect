package com.healthconnect.dto;

import com.healthconnect.entity.AiConversation;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatResponse {
    
    private Long conversationId;
    private String conversationTitle;
    private AiConversation.ConversationType conversationType;
    private String userMessage;
    private String aiResponse;
    private LocalDateTime timestamp;
    private String metadata;
    private boolean isNewConversation;
}
