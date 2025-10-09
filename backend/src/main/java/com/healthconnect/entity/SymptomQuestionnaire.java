package com.healthconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "symptom_questionnaires")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomQuestionnaire {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private AiConversation conversation;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionnaireStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionnaireType type;
    
    @Column(name = "current_step")
    private Integer currentStep = 0;
    
    @Column(name = "total_steps")
    private Integer totalSteps;
    
    @Column(columnDefinition = "JSON")
    private String responses; // JSON string of responses
    
    @Column(columnDefinition = "JSON")
    private String analysis_result; // JSON string of analysis
    
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;
    
    @Column(name = "completion_percentage")
    private Double completionPercentage = 0.0;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    public enum QuestionnaireStatus {
        DRAFT,
        IN_PROGRESS,
        COMPLETED,
        ABANDONED,
        REVIEWED
    }
    
    public enum QuestionnaireType {
        GENERAL_SYMPTOMS,
        CARDIOVASCULAR,
        RESPIRATORY,
        NEUROLOGICAL,
        GASTROINTESTINAL,
        MUSCULOSKELETAL,
        DERMATOLOGICAL,
        MENTAL_HEALTH,
        EMERGENCY_ASSESSMENT
    }
    
    public enum RiskLevel {
        VERY_LOW,
        LOW,
        MODERATE,
        HIGH,
        VERY_HIGH,
        EMERGENCY
    }
}
