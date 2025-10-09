package com.healthconnect.controller;

import com.healthconnect.entity.User;
import com.healthconnect.entity.UserRole;
import com.healthconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class DebugController {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @PostMapping("/create-test-accounts")
    @Transactional
    public ResponseEntity<?> createTestAccounts() {
        try {
            // Delete existing test accounts
            userRepository.deleteByEmail("patient.test@healthconnect.com");
            userRepository.deleteByEmail("doctor.test@healthconnect.com");
            
            // Create test patient
            User patient = new User();
            patient.setFullName("Jane Doe");
            patient.setEmail("patient.test@healthconnect.com");
            patient.setPassword(passwordEncoder.encode("password123"));
            patient.setRole(UserRole.PATIENT);
            patient.setPhoneNumber("+1-555-0102");
            patient.setAddress("456 Patient St, Healthcare City, HC 12345");
            patient.setIsActive(true);
            userRepository.save(patient);
            
            // Create test doctor
            User doctor = new User();
            doctor.setFullName("Dr. John Smith");
            doctor.setEmail("doctor.test@healthconnect.com");
            doctor.setPassword(passwordEncoder.encode("password123"));
            doctor.setRole(UserRole.DOCTOR);
            doctor.setSpecialization("Cardiology");
            doctor.setLicenseNumber("MD123456");
            doctor.setAffiliation("HealthConnect Medical Center");
            doctor.setYearsOfExperience(10);
            doctor.setPhoneNumber("+1-555-0101");
            doctor.setAddress("123 Medical Center Dr, Healthcare City, HC 12345");
            doctor.setIsActive(true);
            userRepository.save(doctor);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Test accounts created successfully");
            response.put("patient", Map.of("email", patient.getEmail(), "id", patient.getId()));
            response.put("doctor", Map.of("email", doctor.getEmail(), "id", doctor.getId()));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating test accounts: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
    
    @PostMapping("/test-password")
    public ResponseEntity<?> testPassword(@RequestParam String email, @RequestParam String password) {
        try {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }

            boolean matches = passwordEncoder.matches(password, user.getPassword());

            Map<String, Object> response = new HashMap<>();
            response.put("email", email);
            response.put("passwordMatches", matches);
            response.put("storedPasswordHash", user.getPassword());
            response.put("inputPassword", password);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/reset-test-passwords")
    @Transactional
    public ResponseEntity<?> resetTestPasswords() {
        try {
            // Reset patient password
            User patient = userRepository.findByEmail("patient.test@healthconnect.com").orElse(null);
            if (patient != null) {
                patient.setPassword(passwordEncoder.encode("password123"));
                userRepository.save(patient);
            }

            // Reset doctor password
            User doctor = userRepository.findByEmail("doctor.test@healthconnect.com").orElse(null);
            if (doctor != null) {
                doctor.setPassword(passwordEncoder.encode("password123"));
                userRepository.save(doctor);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Test passwords reset successfully");
            response.put("patientReset", patient != null);
            response.put("doctorReset", doctor != null);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error resetting test passwords: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
