package com.healthconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "digital_prescriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalPrescription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "prescription_number", unique = true, nullable = false)
    private String prescriptionNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id")
    private VideoConsultation consultation;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrescriptionStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrescriptionType type;
    
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;
    
    @Column(name = "expiry_date")
    private LocalDate expiryDate;
    
    @Column(name = "valid_until")
    private LocalDate validUntil;
    
    @Column(columnDefinition = "TEXT")
    private String diagnosis;
    
    @Column(columnDefinition = "TEXT")
    private String symptoms;
    
    @Column(columnDefinition = "TEXT")
    private String instructions;
    
    @Column(columnDefinition = "TEXT")
    private String warnings;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "refills_allowed")
    private Integer refillsAllowed = 0;
    
    @Column(name = "refills_remaining")
    private Integer refillsRemaining = 0;
    
    @Column(name = "pharmacy_name")
    private String pharmacyName;
    
    @Column(name = "pharmacy_address")
    private String pharmacyAddress;
    
    @Column(name = "pharmacy_phone")
    private String pharmacyPhone;
    
    @Column(name = "digital_signature")
    private String digitalSignature;
    
    @Column(name = "verification_code")
    private String verificationCode;
    
    @Column(name = "qr_code")
    private String qrCode;
    
    @Column(name = "dispensed_date")
    private LocalDate dispensedDate;
    
    @Column(name = "dispensed_by")
    private String dispensedBy;
    
    @Column(name = "dispensed_pharmacy")
    private String dispensedPharmacy;
    
    @Column(name = "insurance_approved")
    private Boolean insuranceApproved = false;
    
    @Column(name = "insurance_claim_number")
    private String insuranceClaimNumber;
    
    @Column(name = "total_cost")
    private Double totalCost;
    
    @Column(name = "patient_cost")
    private Double patientCost;
    
    @Column(name = "insurance_coverage")
    private Double insuranceCoverage;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PrescriptionMedication> medications;
    
    public enum PrescriptionStatus {
        DRAFT,
        ISSUED,
        SENT_TO_PHARMACY,
        PARTIALLY_DISPENSED,
        FULLY_DISPENSED,
        EXPIRED,
        CANCELLED,
        REJECTED
    }
    
    public enum PrescriptionType {
        ACUTE,
        CHRONIC,
        REPEAT,
        EMERGENCY,
        CONTROLLED_SUBSTANCE,
        OVER_THE_COUNTER,
        SPECIALIST_PRESCRIPTION
    }
}
