package com.healthconnect.dto;

import com.healthconnect.entity.UserRole;
import lombok.Data;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Builder
public class AuthResponse {
    private Long id;
    private String fullName;
    private String email;
    private UserRole role;
    private String token;
    private String avatar;
    
    // Doctor-specific fields
    private String specialization;
    private String licenseNumber;
    private String affiliation;
    private Integer yearsOfExperience;
    
    // Common fields
    private String phoneNumber;
    private String address;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private String message;
}
