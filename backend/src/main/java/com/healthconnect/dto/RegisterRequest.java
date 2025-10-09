package com.healthconnect.dto;

import com.healthconnect.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;
    
    @Email(message = "Please provide a valid email address")
    @NotBlank(message = "Email is required")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;
    
    @NotNull(message = "Role is required")
    private UserRole role;
    
    // Doctor-specific fields (optional for patients)
    private String specialization;
    private String licenseNumber;
    private String affiliation;
    private Integer yearsOfExperience;
    
    // Common optional fields
    private String phoneNumber;
    private String address;
}
