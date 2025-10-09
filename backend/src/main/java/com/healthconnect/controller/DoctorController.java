package com.healthconnect.controller;

import com.healthconnect.dto.TimeSlotResponse;
import com.healthconnect.entity.User;
import com.healthconnect.entity.UserRole;
import com.healthconnect.repository.UserRepository;
import com.healthconnect.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {
    
    private final UserRepository userRepository;
    private final AppointmentService appointmentService;
    
    // Get all doctors with optional specialization filter
    @GetMapping
    public ResponseEntity<List<User>> getDoctors(
            @RequestParam(required = false) String specialization) {
        
        List<User> doctors;
        
        if (specialization != null && !specialization.trim().isEmpty()) {
            doctors = userRepository.findByRoleAndSpecializationContainingIgnoreCaseAndIsActiveTrue(
                    UserRole.DOCTOR, specialization);
        } else {
            doctors = userRepository.findByRoleAndIsActiveTrue(UserRole.DOCTOR);
        }
        
        return ResponseEntity.ok(doctors);
    }
    
    // Get doctor by ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getDoctor(@PathVariable Long id) {
        return userRepository.findByIdAndRoleAndIsActiveTrue(id, UserRole.DOCTOR)
                .map(doctor -> ResponseEntity.ok(doctor))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Get available time slots for a doctor
    @GetMapping("/{doctorId}/time-slots")
    public ResponseEntity<?> getAvailableTimeSlots(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        try {
            List<TimeSlotResponse> timeSlots = appointmentService.getAvailableTimeSlots(doctorId, date);
            return ResponseEntity.ok(timeSlots);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "doctorId", doctorId,
                "date", date.toString()
            ));
        }
    }
    
    // Get doctor's specializations (for filtering)
    @GetMapping("/specializations")
    public ResponseEntity<List<String>> getSpecializations() {
        List<String> specializations = userRepository.findDistinctSpecializations();
        return ResponseEntity.ok(specializations);
    }

    // Debug endpoint to list all doctors with their IDs
    @GetMapping("/debug/all")
    public ResponseEntity<List<Map<String, Object>>> getAllDoctorsDebug() {
        List<User> doctors = userRepository.findByRole(UserRole.DOCTOR);
        List<Map<String, Object>> doctorInfo = doctors.stream()
            .map(doctor -> {
                Map<String, Object> info = new HashMap<>();
                info.put("id", doctor.getId());
                info.put("name", doctor.getFullName());
                info.put("email", doctor.getEmail());
                info.put("specialization", doctor.getSpecialization() != null ? doctor.getSpecialization() : "N/A");
                return info;
            })
            .toList();
        return ResponseEntity.ok(doctorInfo);
    }
}
