package com.healthconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "doctor_availability")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorAvailability {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AvailabilityStatus status = AvailabilityStatus.OFFLINE;
    
    @Column
    private LocalTime chatStartTime;
    
    @Column
    private LocalTime chatEndTime;
    
    @Column
    private String expectedResponseTime; // e.g., "Within 2 hours", "Same day"
    
    @Column
    private String customMessage; // Custom availability message
    
    @Column
    private LocalDateTime lastSeen;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public boolean isAvailableNow() {
        if (status == AvailabilityStatus.OFFLINE) {
            return false;
        }
        
        LocalTime now = LocalTime.now();
        if (chatStartTime != null && chatEndTime != null) {
            return !now.isBefore(chatStartTime) && !now.isAfter(chatEndTime);
        }
        
        return status == AvailabilityStatus.ONLINE;
    }
}
