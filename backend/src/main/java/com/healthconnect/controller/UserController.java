package com.healthconnect.controller;

import com.healthconnect.dto.UpdateProfileRequest;
import com.healthconnect.entity.User;
import com.healthconnect.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
// CORS disabled - removed @CrossOrigin annotation
public class UserController {
    
    private final UserService userService;
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            User user = userService.getCurrentUser();
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to get user profile: " + e.getMessage());
        }
    }
    
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        try {
            User updatedUser = userService.updateProfile(request);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to update profile: " + e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR') or @userService.getCurrentUser().id == #id")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to get user: " + e.getMessage());
        }
    }

    @GetMapping("/doctors")
    public ResponseEntity<?> getAllDoctors() {
        try {
            return ResponseEntity.ok(userService.getAllDoctors());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to get doctors: " + e.getMessage());
        }
    }

    @GetMapping("/patients")
    public ResponseEntity<?> getAllPatients() {
        try {
            return ResponseEntity.ok(userService.getAllPatients());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to get patients: " + e.getMessage());
        }
    }
}
