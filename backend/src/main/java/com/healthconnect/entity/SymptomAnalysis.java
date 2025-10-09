package com.healthconnect.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "symptom_analyses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomAnalysis {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private AiConversation conversation;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String symptoms;
    
    @Column(columnDefinition = "TEXT")
    private String analysis;
    
    @Column(columnDefinition = "TEXT")
    private String recommendations;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UrgencyLevel urgencyLevel;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isSharedWithDoctor = false;
    
    @Column
    private Long sharedWithDoctorId;
    
    @Column
    private LocalDateTime sharedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum UrgencyLevel {
        LOW,
        MODERATE,
        HIGH,
        EMERGENCY
    }
}
