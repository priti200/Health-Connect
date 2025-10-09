package com.healthconnect.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatRequest {
    
    @NotNull(message = "Participant ID is required")
    private Long participantId;
}
