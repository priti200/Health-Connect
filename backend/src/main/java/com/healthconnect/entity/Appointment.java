package com.healthconnect.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Appointment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    @JsonIgnoreProperties({"password", "appointments", "hibernateLazyInitializer", "handler"})
    private User doctor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"password", "appointments", "hibernateLazyInitializer", "handler"})
    private User patient;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false)
    private LocalTime startTime;
    
    @Column(nullable = false)
    private LocalTime endTime;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status = AppointmentStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentType type;
    
    @Column
    private String reasonForVisit;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column
    private String meetingLink;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Helper methods
    public boolean isScheduled() {
        return AppointmentStatus.SCHEDULED.equals(this.status);
    }
    
    public boolean isCompleted() {
        return AppointmentStatus.COMPLETED.equals(this.status);
    }
    
    public boolean isCancelled() {
        return AppointmentStatus.CANCELLED.equals(this.status);
    }
    
    public boolean isVideoCall() {
        return AppointmentType.VIDEO_CALL.equals(this.type);
    }
    
    public boolean isInPerson() {
        return AppointmentType.IN_PERSON.equals(this.type);
    }
}
