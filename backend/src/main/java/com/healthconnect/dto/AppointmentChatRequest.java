package com.healthconnect.dto;

import com.healthconnect.entity.ChatType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AppointmentChatRequest {
    
    @NotNull(message = "Participant ID is required")
    private Long participantId;
    
    private ChatType chatType = ChatType.GENERAL;
    
    private String subject;
}
