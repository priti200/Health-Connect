package com.healthconnect.service;

import com.healthconnect.dto.UpdateProfileRequest;
import com.healthconnect.entity.User;
import com.healthconnect.entity.UserRole;
import com.healthconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    
    private final UserRepository userRepository;
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }
    
    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
    
    @Transactional
    public User updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();
        
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName());
        }
        
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        
        // Update doctor-specific fields
        if (user.isDoctor()) {
            if (request.getSpecialization() != null) {
                user.setSpecialization(request.getSpecialization());
            }
            
            if (request.getAffiliation() != null) {
                user.setAffiliation(request.getAffiliation());
            }
            
            if (request.getYearsOfExperience() != null) {
                user.setYearsOfExperience(request.getYearsOfExperience());
            }
        }
        
        return userRepository.save(user);
    }
    
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public java.util.Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public java.util.Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public java.util.List<User> getAllDoctors() {
        return userRepository.findByRoleAndIsActiveTrue(UserRole.DOCTOR);
    }

    public java.util.List<User> getAllPatients() {
        return userRepository.findByRoleAndIsActiveTrue(UserRole.PATIENT);
    }
}
