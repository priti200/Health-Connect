package com.healthconnect.dto;

import com.healthconnect.entity.AiConversation;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiConversationResponse {
    
    private Long id;
    private String title;
    private AiConversation.ConversationType conversationType;
    private String summary;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isSharedWithDoctor;
    private Long sharedWithDoctorId;
    private LocalDateTime sharedAt;
    private int messageCount;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private List<AiMessageResponse> messages;
}
