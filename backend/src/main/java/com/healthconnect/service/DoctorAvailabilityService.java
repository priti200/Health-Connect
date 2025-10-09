package com.healthconnect.service;

import com.healthconnect.entity.AvailabilityStatus;
import com.healthconnect.entity.DoctorAvailability;
import com.healthconnect.entity.User;
import com.healthconnect.repository.DoctorAvailabilityRepository;
import com.healthconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class DoctorAvailabilityService {
    
    private final DoctorAvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;
    
    public DoctorAvailability updateDoctorStatus(Long doctorId, AvailabilityStatus status) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        DoctorAvailability availability = availabilityRepository.findByDoctor(doctor)
                .orElseGet(() -> {
                    DoctorAvailability newAvailability = new DoctorAvailability();
                    newAvailability.setDoctor(doctor);
                    return newAvailability;
                });
        
        availability.setStatus(status);
        availability.setLastSeen(LocalDateTime.now());
        
        return availabilityRepository.save(availability);
    }
    
    public DoctorAvailability updateChatHours(Long doctorId, LocalTime startTime, LocalTime endTime, String expectedResponseTime) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        DoctorAvailability availability = availabilityRepository.findByDoctor(doctor)
                .orElseGet(() -> {
                    DoctorAvailability newAvailability = new DoctorAvailability();
                    newAvailability.setDoctor(doctor);
                    return newAvailability;
                });
        
        availability.setChatStartTime(startTime);
        availability.setChatEndTime(endTime);
        availability.setExpectedResponseTime(expectedResponseTime);
        
        return availabilityRepository.save(availability);
    }
    
    public Optional<DoctorAvailability> getDoctorAvailability(Long doctorId) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        return availabilityRepository.findByDoctor(doctor);
    }
    
    public boolean isDoctorAvailable(Long doctorId) {
        Optional<DoctorAvailability> availability = getDoctorAvailability(doctorId);
        return availability.map(DoctorAvailability::isAvailableNow).orElse(false);
    }
    
    public void updateLastSeen(Long doctorId) {
        getDoctorAvailability(doctorId).ifPresent(availability -> {
            availability.setLastSeen(LocalDateTime.now());
            availabilityRepository.save(availability);
        });
    }
}
