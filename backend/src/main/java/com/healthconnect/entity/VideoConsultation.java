package com.healthconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Entity
@Table(name = "video_consultations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoConsultation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User patient;
    
    @Column(name = "room_id", unique = true, nullable = false)
    private String roomId;
    
    @Column(name = "session_id")
    private String sessionId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConsultationStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConsultationType type;
    
    @Column(name = "scheduled_start_time", nullable = false)
    private LocalDateTime scheduledStartTime;
    
    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes;
    
    @Column(name = "doctor_join_time")
    private LocalDateTime doctorJoinTime;
    
    @Column(name = "patient_join_time")
    private LocalDateTime patientJoinTime;
    
    @Column(name = "recording_enabled")
    private Boolean recordingEnabled = false;
    
    @Column(name = "recording_url")
    private String recordingUrl;
    
    @Column(name = "recording_consent")
    private Boolean recordingConsent = false;
    
    @Column(name = "screen_sharing_enabled")
    private Boolean screenSharingEnabled = false;
    
    @Column(name = "chat_enabled")
    private Boolean chatEnabled = true;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(columnDefinition = "TEXT")
    private String prescription;
    
    @Column(columnDefinition = "TEXT")
    private String diagnosis;
    
    @Column(columnDefinition = "TEXT")
    private String recommendations;
    
    @Column(name = "follow_up_required")
    private Boolean followUpRequired = false;
    
    @Column(name = "follow_up_date")
    private LocalDateTime followUpDate;
    
    @Column(name = "technical_issues")
    private String technicalIssues;
    
    @Column(name = "quality_rating")
    private Integer qualityRating; // 1-5 scale
    
    @Column(name = "patient_satisfaction")
    private Integer patientSatisfaction; // 1-5 scale
    
    @Column(name = "doctor_notes", columnDefinition = "TEXT")
    private String doctorNotes;
    
    @Column(name = "patient_feedback", columnDefinition = "TEXT")
    private String patientFeedback;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum ConsultationStatus {
        SCHEDULED,
        WAITING_FOR_DOCTOR,
        WAITING_FOR_PATIENT,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        NO_SHOW,
        TECHNICAL_ISSUES
    }
    
    public enum ConsultationType {
        ROUTINE_CHECKUP,
        FOLLOW_UP,
        URGENT_CARE,
        SPECIALIST_CONSULTATION,
        MENTAL_HEALTH,
        PRESCRIPTION_REVIEW,
        SECOND_OPINION,
        EMERGENCY_CONSULTATION
    }
}
