package com.healthconnect.service;

import com.healthconnect.entity.DigitalPrescription;
import com.healthconnect.entity.User;
import com.healthconnect.entity.Appointment;
import com.healthconnect.entity.VideoConsultation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InsuranceService {
    
    private final NotificationService notificationService;
    
    // Mock insurance providers and their coverage details
    private static final Map<String, InsuranceProvider> INSURANCE_PROVIDERS = Map.of(
        "BLUE_CROSS", new InsuranceProvider("Blue Cross Blue Shield", 0.80, 0.70, 0.90),
        "AETNA", new InsuranceProvider("Aetna", 0.75, 0.65, 0.85),
        "CIGNA", new InsuranceProvider("Cigna", 0.78, 0.68, 0.88),
        "UNITED_HEALTH", new InsuranceProvider("United Healthcare", 0.82, 0.72, 0.92),
        "HUMANA", new InsuranceProvider("Humana", 0.76, 0.66, 0.86)
    );
    
    @Transactional
    public InsuranceClaim processClaimForPrescription(DigitalPrescription prescription) {
        log.info("Processing insurance claim for prescription: {}", prescription.getId());
        
        try {
            // Get patient insurance information (mock)
            String insuranceProvider = getPatientInsuranceProvider(prescription.getPatient());
            String policyNumber = getPatientPolicyNumber(prescription.getPatient());
            
            if (insuranceProvider == null || policyNumber == null) {
                log.warn("No insurance information found for patient: {}", prescription.getPatient().getId());
                return null;
            }
            
            // Calculate coverage
            InsuranceProvider provider = INSURANCE_PROVIDERS.get(insuranceProvider);
            if (provider == null) {
                log.warn("Unknown insurance provider: {}", insuranceProvider);
                return null;
            }
            
            double totalCost = calculatePrescriptionCost(prescription);
            double coveragePercentage = provider.getPrescriptionCoverage();
            double insuranceCoverage = totalCost * coveragePercentage;
            double patientCost = totalCost - insuranceCoverage;
            
            // Create claim
            InsuranceClaim claim = InsuranceClaim.builder()
                    .claimNumber(generateClaimNumber())
                    .prescriptionId(prescription.getId())
                    .patientId(prescription.getPatient().getId())
                    .insuranceProvider(provider.getName())
                    .policyNumber(policyNumber)
                    .totalCost(BigDecimal.valueOf(totalCost).setScale(2, RoundingMode.HALF_UP))
                    .insuranceCoverage(BigDecimal.valueOf(insuranceCoverage).setScale(2, RoundingMode.HALF_UP))
                    .patientCost(BigDecimal.valueOf(patientCost).setScale(2, RoundingMode.HALF_UP))
                    .coveragePercentage(BigDecimal.valueOf(coveragePercentage).setScale(4, RoundingMode.HALF_UP))
                    .status(InsuranceClaim.ClaimStatus.SUBMITTED)
                    .submittedAt(LocalDateTime.now())
                    .build();
            
            // Update prescription with insurance information
            prescription.setInsuranceApproved(true);
            prescription.setInsuranceClaimNumber(claim.getClaimNumber());
            prescription.setTotalCost(totalCost);
            prescription.setPatientCost(patientCost);
            prescription.setInsuranceCoverage(insuranceCoverage);
            
            // Simulate claim processing (in real implementation, this would be async)
            processClaimAsync(claim);
            
            log.info("Insurance claim processed successfully: {}", claim.getClaimNumber());
            return claim;
            
        } catch (Exception e) {
            log.error("Error processing insurance claim for prescription: {}", prescription.getId(), e);
            throw new RuntimeException("Failed to process insurance claim", e);
        }
    }
    
    @Transactional
    public InsuranceClaim processClaimForConsultation(VideoConsultation consultation) {
        log.info("Processing insurance claim for consultation: {}", consultation.getId());
        
        try {
            // Get patient insurance information
            String insuranceProvider = getPatientInsuranceProvider(consultation.getPatient());
            String policyNumber = getPatientPolicyNumber(consultation.getPatient());
            
            if (insuranceProvider == null || policyNumber == null) {
                log.warn("No insurance information found for patient: {}", consultation.getPatient().getId());
                return null;
            }
            
            // Calculate coverage
            InsuranceProvider provider = INSURANCE_PROVIDERS.get(insuranceProvider);
            if (provider == null) {
                log.warn("Unknown insurance provider: {}", insuranceProvider);
                return null;
            }
            
            double totalCost = calculateConsultationCost(consultation);
            double coveragePercentage = provider.getConsultationCoverage();
            double insuranceCoverage = totalCost * coveragePercentage;
            double patientCost = totalCost - insuranceCoverage;
            
            // Create claim
            InsuranceClaim claim = InsuranceClaim.builder()
                    .claimNumber(generateClaimNumber())
                    .consultationId(consultation.getId())
                    .patientId(consultation.getPatient().getId())
                    .insuranceProvider(provider.getName())
                    .policyNumber(policyNumber)
                    .totalCost(BigDecimal.valueOf(totalCost).setScale(2, RoundingMode.HALF_UP))
                    .insuranceCoverage(BigDecimal.valueOf(insuranceCoverage).setScale(2, RoundingMode.HALF_UP))
                    .patientCost(BigDecimal.valueOf(patientCost).setScale(2, RoundingMode.HALF_UP))
                    .coveragePercentage(BigDecimal.valueOf(coveragePercentage).setScale(4, RoundingMode.HALF_UP))
                    .status(InsuranceClaim.ClaimStatus.SUBMITTED)
                    .submittedAt(LocalDateTime.now())
                    .build();
            
            // Simulate claim processing
            processClaimAsync(claim);
            
            log.info("Insurance claim processed successfully: {}", claim.getClaimNumber());
            return claim;
            
        } catch (Exception e) {
            log.error("Error processing insurance claim for consultation: {}", consultation.getId(), e);
            throw new RuntimeException("Failed to process insurance claim", e);
        }
    }
    
    public InsuranceEligibility checkEligibility(User patient, String serviceType) {
        log.info("Checking insurance eligibility for patient: {} and service: {}", patient.getId(), serviceType);
        
        try {
            String insuranceProvider = getPatientInsuranceProvider(patient);
            String policyNumber = getPatientPolicyNumber(patient);
            
            if (insuranceProvider == null || policyNumber == null) {
                return InsuranceEligibility.builder()
                        .eligible(false)
                        .reason("No insurance information on file")
                        .build();
            }
            
            InsuranceProvider provider = INSURANCE_PROVIDERS.get(insuranceProvider);
            if (provider == null) {
                return InsuranceEligibility.builder()
                        .eligible(false)
                        .reason("Insurance provider not recognized")
                        .build();
            }
            
            // Mock eligibility check (in real implementation, this would call insurance API)
            boolean eligible = Math.random() > 0.1; // 90% eligibility rate
            double coveragePercentage = switch (serviceType.toLowerCase()) {
                case "prescription" -> provider.getPrescriptionCoverage();
                case "consultation" -> provider.getConsultationCoverage();
                case "appointment" -> provider.getAppointmentCoverage();
                default -> 0.0;
            };
            
            return InsuranceEligibility.builder()
                    .eligible(eligible)
                    .coveragePercentage(BigDecimal.valueOf(coveragePercentage).setScale(4, RoundingMode.HALF_UP))
                    .reason(eligible ? "Coverage verified" : "Coverage not available for this service")
                    .effectiveDate(LocalDateTime.now().minusYears(1))
                    .expirationDate(LocalDateTime.now().plusYears(1))
                    .build();
            
        } catch (Exception e) {
            log.error("Error checking insurance eligibility", e);
            return InsuranceEligibility.builder()
                    .eligible(false)
                    .reason("Error verifying coverage")
                    .build();
        }
    }
    
    public List<InsuranceProvider> getSupportedProviders() {
        return INSURANCE_PROVIDERS.values().stream().toList();
    }
    
    // Helper methods
    private String getPatientInsuranceProvider(User patient) {
        // Mock implementation - in real system, this would query patient insurance records
        return "BLUE_CROSS"; // Default for demo
    }
    
    private String getPatientPolicyNumber(User patient) {
        // Mock implementation
        return "BC" + patient.getId() + "001";
    }
    
    private double calculatePrescriptionCost(DigitalPrescription prescription) {
        // Mock cost calculation based on medications
        return prescription.getMedications() != null ? 
               prescription.getMedications().size() * 25.0 + Math.random() * 50.0 : 
               50.0 + Math.random() * 100.0;
    }
    
    private double calculateConsultationCost(VideoConsultation consultation) {
        // Mock cost calculation based on consultation type and duration
        double baseCost = switch (consultation.getType()) {
            case ROUTINE_CHECKUP -> 150.0;
            case FOLLOW_UP -> 100.0;
            case URGENT_CARE -> 200.0;
            case SPECIALIST_CONSULTATION -> 300.0;
            case MENTAL_HEALTH -> 180.0;
            case PRESCRIPTION_REVIEW -> 80.0;
            case SECOND_OPINION -> 250.0;
            case EMERGENCY_CONSULTATION -> 400.0;
        };
        
        // Add duration-based cost
        if (consultation.getDurationMinutes() != null) {
            baseCost += (consultation.getDurationMinutes() / 15.0) * 25.0;
        }
        
        return baseCost;
    }
    
    private String generateClaimNumber() {
        return "CLM" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
    
    private void processClaimAsync(InsuranceClaim claim) {
        // Simulate async claim processing
        new Thread(() -> {
            try {
                Thread.sleep(2000); // Simulate processing time
                
                // Mock approval (90% approval rate)
                boolean approved = Math.random() > 0.1;
                
                if (approved) {
                    claim.setStatus(InsuranceClaim.ClaimStatus.APPROVED);
                    claim.setApprovedAt(LocalDateTime.now());
                } else {
                    claim.setStatus(InsuranceClaim.ClaimStatus.DENIED);
                    claim.setDeniedAt(LocalDateTime.now());
                    claim.setDenialReason("Service not covered under current policy");
                }
                
                log.info("Insurance claim {} processed: {}", claim.getClaimNumber(), claim.getStatus());
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Claim processing interrupted", e);
            }
        }).start();
    }
    
    // Inner classes for data structures
    public static class InsuranceProvider {
        private final String name;
        private final double consultationCoverage;
        private final double prescriptionCoverage;
        private final double appointmentCoverage;

        public InsuranceProvider(String name, double consultationCoverage, double prescriptionCoverage, double appointmentCoverage) {
            this.name = name;
            this.consultationCoverage = consultationCoverage;
            this.prescriptionCoverage = prescriptionCoverage;
            this.appointmentCoverage = appointmentCoverage;
        }

        // Getters
        public String getName() { return name; }
        public double getConsultationCoverage() { return consultationCoverage; }
        public double getPrescriptionCoverage() { return prescriptionCoverage; }
        public double getAppointmentCoverage() { return appointmentCoverage; }
    }

    public static class InsuranceClaim {
        private String claimNumber;
        private Long prescriptionId;
        private Long consultationId;
        private Long patientId;
        private String insuranceProvider;
        private String policyNumber;
        private BigDecimal totalCost;
        private BigDecimal insuranceCoverage;
        private BigDecimal patientCost;
        private BigDecimal coveragePercentage;
        private ClaimStatus status;
        private LocalDateTime submittedAt;
        private LocalDateTime approvedAt;
        private LocalDateTime deniedAt;
        private String denialReason;

        public enum ClaimStatus {
            SUBMITTED, APPROVED, DENIED, PENDING_REVIEW, CANCELLED
        }

        public static InsuranceClaimBuilder builder() {
            return new InsuranceClaimBuilder();
        }

        // Getters and setters
        public String getClaimNumber() { return claimNumber; }
        public void setClaimNumber(String claimNumber) { this.claimNumber = claimNumber; }
        public Long getPrescriptionId() { return prescriptionId; }
        public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }
        public Long getConsultationId() { return consultationId; }
        public void setConsultationId(Long consultationId) { this.consultationId = consultationId; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getInsuranceProvider() { return insuranceProvider; }
        public void setInsuranceProvider(String insuranceProvider) { this.insuranceProvider = insuranceProvider; }
        public String getPolicyNumber() { return policyNumber; }
        public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }
        public BigDecimal getTotalCost() { return totalCost; }
        public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }
        public BigDecimal getInsuranceCoverage() { return insuranceCoverage; }
        public void setInsuranceCoverage(BigDecimal insuranceCoverage) { this.insuranceCoverage = insuranceCoverage; }
        public BigDecimal getPatientCost() { return patientCost; }
        public void setPatientCost(BigDecimal patientCost) { this.patientCost = patientCost; }
        public BigDecimal getCoveragePercentage() { return coveragePercentage; }
        public void setCoveragePercentage(BigDecimal coveragePercentage) { this.coveragePercentage = coveragePercentage; }
        public ClaimStatus getStatus() { return status; }
        public void setStatus(ClaimStatus status) { this.status = status; }
        public LocalDateTime getSubmittedAt() { return submittedAt; }
        public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
        public LocalDateTime getApprovedAt() { return approvedAt; }
        public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
        public LocalDateTime getDeniedAt() { return deniedAt; }
        public void setDeniedAt(LocalDateTime deniedAt) { this.deniedAt = deniedAt; }
        public String getDenialReason() { return denialReason; }
        public void setDenialReason(String denialReason) { this.denialReason = denialReason; }

        public static class InsuranceClaimBuilder {
            private InsuranceClaim claim = new InsuranceClaim();

            public InsuranceClaimBuilder claimNumber(String claimNumber) { claim.claimNumber = claimNumber; return this; }
            public InsuranceClaimBuilder prescriptionId(Long prescriptionId) { claim.prescriptionId = prescriptionId; return this; }
            public InsuranceClaimBuilder consultationId(Long consultationId) { claim.consultationId = consultationId; return this; }
            public InsuranceClaimBuilder patientId(Long patientId) { claim.patientId = patientId; return this; }
            public InsuranceClaimBuilder insuranceProvider(String insuranceProvider) { claim.insuranceProvider = insuranceProvider; return this; }
            public InsuranceClaimBuilder policyNumber(String policyNumber) { claim.policyNumber = policyNumber; return this; }
            public InsuranceClaimBuilder totalCost(BigDecimal totalCost) { claim.totalCost = totalCost; return this; }
            public InsuranceClaimBuilder insuranceCoverage(BigDecimal insuranceCoverage) { claim.insuranceCoverage = insuranceCoverage; return this; }
            public InsuranceClaimBuilder patientCost(BigDecimal patientCost) { claim.patientCost = patientCost; return this; }
            public InsuranceClaimBuilder coveragePercentage(BigDecimal coveragePercentage) { claim.coveragePercentage = coveragePercentage; return this; }
            public InsuranceClaimBuilder status(ClaimStatus status) { claim.status = status; return this; }
            public InsuranceClaimBuilder submittedAt(LocalDateTime submittedAt) { claim.submittedAt = submittedAt; return this; }
            public InsuranceClaim build() { return claim; }
        }
    }

    public static class InsuranceEligibility {
        private boolean eligible;
        private BigDecimal coveragePercentage;
        private String reason;
        private LocalDateTime effectiveDate;
        private LocalDateTime expirationDate;

        public static InsuranceEligibilityBuilder builder() {
            return new InsuranceEligibilityBuilder();
        }

        // Getters and setters
        public boolean isEligible() { return eligible; }
        public void setEligible(boolean eligible) { this.eligible = eligible; }
        public BigDecimal getCoveragePercentage() { return coveragePercentage; }
        public void setCoveragePercentage(BigDecimal coveragePercentage) { this.coveragePercentage = coveragePercentage; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public LocalDateTime getEffectiveDate() { return effectiveDate; }
        public void setEffectiveDate(LocalDateTime effectiveDate) { this.effectiveDate = effectiveDate; }
        public LocalDateTime getExpirationDate() { return expirationDate; }
        public void setExpirationDate(LocalDateTime expirationDate) { this.expirationDate = expirationDate; }

        public static class InsuranceEligibilityBuilder {
            private InsuranceEligibility eligibility = new InsuranceEligibility();

            public InsuranceEligibilityBuilder eligible(boolean eligible) { eligibility.eligible = eligible; return this; }
            public InsuranceEligibilityBuilder coveragePercentage(BigDecimal coveragePercentage) { eligibility.coveragePercentage = coveragePercentage; return this; }
            public InsuranceEligibilityBuilder reason(String reason) { eligibility.reason = reason; return this; }
            public InsuranceEligibilityBuilder effectiveDate(LocalDateTime effectiveDate) { eligibility.effectiveDate = effectiveDate; return this; }
            public InsuranceEligibilityBuilder expirationDate(LocalDateTime expirationDate) { eligibility.expirationDate = expirationDate; return this; }
            public InsuranceEligibility build() { return eligibility; }
        }
    }
}
