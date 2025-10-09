package com.healthconnect.service;

import com.healthconnect.dto.AuthResponse;
import com.healthconnect.dto.LoginRequest;
import com.healthconnect.dto.RegisterRequest;
import com.healthconnect.entity.User;
import com.healthconnect.entity.UserRole;
import com.healthconnect.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        
        // For doctors, validate license number uniqueness
        if (request.getRole() == UserRole.DOCTOR) {
            validateDoctorRegistration(request);
        }
        
        // Create user
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAddress(request.getAddress());
        
        // Set doctor-specific fields
        if (request.getRole() == UserRole.DOCTOR) {
            user.setSpecialization(request.getSpecialization());
            user.setLicenseNumber(request.getLicenseNumber());
            user.setAffiliation(request.getAffiliation());
            user.setYearsOfExperience(request.getYearsOfExperience());
        }
        
        user = userRepository.save(user);
        
        // Generate JWT token
        String jwtToken = jwtService.generateToken(user);
        
        return buildAuthResponse(user, jwtToken, "Registration successful");
    }
    
    public AuthResponse authenticate(LoginRequest request) {
        String clientIp = getClientIpAddress();

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );

            User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

            if (!user.getIsActive()) {
                auditService.logAuthenticationAttempt(request.getEmail(), false, clientIp);
                throw new IllegalArgumentException("Account is deactivated");
            }

            String jwtToken = jwtService.generateToken(user);

            // Log successful authentication
            auditService.logAuthenticationAttempt(request.getEmail(), true, clientIp);

            return buildAuthResponse(user, jwtToken, "Login successful");
        } catch (Exception e) {
            // Log failed authentication
            auditService.logAuthenticationAttempt(request.getEmail(), false, clientIp);
            throw e;
        }
    }
    
    private void validateDoctorRegistration(RegisterRequest request) {
        if (request.getSpecialization() == null || request.getSpecialization().trim().isEmpty()) {
            throw new IllegalArgumentException("Specialization is required for doctors");
        }
        
        if (request.getLicenseNumber() == null || request.getLicenseNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("License number is required for doctors");
        }
        
        if (userRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new IllegalArgumentException("License number already registered");
        }
    }
    
    private AuthResponse buildAuthResponse(User user, String token, String message) {
        return AuthResponse.builder()
            .id(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole())
            .token(token)
            .avatar(user.getAvatar())
            .specialization(user.getSpecialization())
            .licenseNumber(user.getLicenseNumber())
            .affiliation(user.getAffiliation())
            .yearsOfExperience(user.getYearsOfExperience())
            .phoneNumber(user.getPhoneNumber())
            .address(user.getAddress())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .message(message)
            .build();
    }

    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attributes.getRequest();

            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }

            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp;
            }

            return request.getRemoteAddr();
        } catch (Exception e) {
            return "unknown";
        }
    }
}
