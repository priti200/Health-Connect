package com.healthconnect.dto;

import com.healthconnect.entity.MessageStatus;
import com.healthconnect.entity.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {

    private Long id;
    private Long chatId;
    private UserResponse sender;
    private String content;
    private MessageStatus status;
    private MessageType type;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime editedAt;

    // File attachment fields
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;

    // Reply functionality
    private MessageResponse replyToMessage;

    // Reactions
    private Map<Long, String> reactions;

    // Mentions
    private List<Long> mentionedUserIds;

    // Additional flags
    private Boolean isUrgent;
    private Boolean isEdited;
    private Boolean hasAttachment;
}
