package com.healthconnect.dto;

import com.healthconnect.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    private Long id;
    private String fullName;
    private String email;
    private UserRole role;
    private String avatar;
    private String specialization; // For doctors
    private String affiliation; // For doctors
}
