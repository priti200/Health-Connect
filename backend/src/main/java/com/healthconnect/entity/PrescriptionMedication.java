package com.healthconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "prescription_medications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionMedication {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private DigitalPrescription prescription;
    
    @Column(name = "medication_name", nullable = false)
    private String medicationName;
    
    @Column(name = "generic_name")
    private String genericName;
    
    @Column(name = "brand_name")
    private String brandName;
    
    @Column(name = "strength", nullable = false)
    private String strength;
    
    @Column(name = "dosage_form", nullable = false)
    private String dosageForm; // tablet, capsule, liquid, injection, etc.
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "unit")
    private String unit; // tablets, ml, mg, etc.
    
    @Column(name = "dosage_instructions", columnDefinition = "TEXT", nullable = false)
    private String dosageInstructions;
    
    @Column(name = "frequency")
    private String frequency; // once daily, twice daily, as needed, etc.
    
    @Column(name = "duration")
    private String duration; // 7 days, 30 days, until finished, etc.
    
    @Column(name = "route_of_administration")
    private String routeOfAdministration; // oral, topical, injection, etc.
    
    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;
    
    @Column(name = "side_effects", columnDefinition = "TEXT")
    private String sideEffects;
    
    @Column(name = "contraindications", columnDefinition = "TEXT")
    private String contraindications;
    
    @Column(name = "drug_interactions", columnDefinition = "TEXT")
    private String drugInteractions;
    
    @Column(name = "food_interactions", columnDefinition = "TEXT")
    private String foodInteractions;
    
    @Column(name = "storage_instructions")
    private String storageInstructions;
    
    @Column(name = "ndc_number")
    private String ndcNumber; // National Drug Code
    
    @Column(name = "rxcui")
    private String rxcui; // RxNorm Concept Unique Identifier
    
    @Column(name = "dea_schedule")
    private String deaSchedule; // For controlled substances
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MedicationStatus status;
    
    @Column(name = "substitution_allowed")
    private Boolean substitutionAllowed = true;
    
    @Column(name = "prior_authorization_required")
    private Boolean priorAuthorizationRequired = false;
    
    @Column(name = "prior_authorization_number")
    private String priorAuthorizationNumber;
    
    @Column(name = "cost_estimate")
    private Double costEstimate;
    
    @Column(name = "insurance_coverage_percentage")
    private Double insuranceCoveragePercentage;
    
    @Column(name = "patient_copay")
    private Double patientCopay;
    
    @Column(name = "dispensed_quantity")
    private Integer dispensedQuantity;
    
    @Column(name = "remaining_quantity")
    private Integer remainingQuantity;
    
    @Column(name = "last_dispensed_date")
    private LocalDateTime lastDispensedDate;
    
    @Column(name = "next_refill_date")
    private LocalDateTime nextRefillDate;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum MedicationStatus {
        PRESCRIBED,
        PENDING_APPROVAL,
        APPROVED,
        DISPENSED,
        PARTIALLY_DISPENSED,
        DISCONTINUED,
        SUBSTITUTED,
        REJECTED
    }
}
