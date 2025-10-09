package com.healthconnect.dto;

import com.healthconnect.entity.AiConversation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequest {
    
    @NotBlank(message = "Message content is required")
    @Size(max = 2000, message = "Message content cannot exceed 2000 characters")
    private String message;
    
    private Long conversationId;
    
    private AiConversation.ConversationType conversationType = AiConversation.ConversationType.GENERAL_HEALTH;
    
    private String conversationTitle;
    
    private boolean isNewConversation = false;
}
