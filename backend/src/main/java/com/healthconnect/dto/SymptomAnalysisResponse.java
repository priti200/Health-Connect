package com.healthconnect.dto;

import com.healthconnect.entity.SymptomAnalysis;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomAnalysisResponse {
    
    private Long id;
    private String symptoms;
    private String analysis;
    private String recommendations;
    private SymptomAnalysis.UrgencyLevel urgencyLevel;
    private LocalDateTime createdAt;
    private boolean isSharedWithDoctor;
    private Long sharedWithDoctorId;
    private LocalDateTime sharedAt;
    private Long conversationId;
    private String urgencyMessage;
    private String disclaimer;
}
