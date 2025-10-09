package com.healthconnect.dto;

import com.healthconnect.entity.AiMessage;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiMessageResponse {
    
    private Long id;
    private String content;
    private AiMessage.MessageRole role;
    private LocalDateTime timestamp;
    private String metadata;
}
