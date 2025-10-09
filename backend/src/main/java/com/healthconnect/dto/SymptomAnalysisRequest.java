package com.healthconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SymptomAnalysisRequest {
    
    @NotBlank(message = "Symptoms description is required")
    @Size(max = 2000, message = "Symptoms description cannot exceed 2000 characters")
    private String symptoms;
    
    private List<String> additionalInfo;
    
    private String duration;
    
    private String severity;
    
    private String previousMedicalHistory;
    
    private String currentMedications;
    
    private Integer age;
    
    private String gender;
    
    private boolean createConversation = true;
}
