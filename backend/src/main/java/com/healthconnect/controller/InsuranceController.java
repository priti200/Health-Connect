package com.healthconnect.controller;

import com.healthconnect.entity.User;
import com.healthconnect.service.InsuranceService;
import com.healthconnect.service.JwtService;
import com.healthconnect.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

// Temporarily disabled due to compilation issues
// @RestController
// @RequestMapping("/api/insurance")
@RequiredArgsConstructor
@Slf4j
public class InsuranceController {
    
    private final InsuranceService insuranceService;
    private final UserService userService;
    private final JwtService jwtService;
    
    @GetMapping("/eligibility/{serviceType}")
    @PreAuthorize("hasRole('PATIENT') or hasRole('DOCTOR')")
    public ResponseEntity<?> checkEligibility(@PathVariable String serviceType,
                                            HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            
            // If doctor is checking, they need to specify patient ID
            if (user.isDoctor()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Doctors must specify patient ID for eligibility checks"
                ));
            }
            
            InsuranceService.InsuranceEligibility eligibility = 
                insuranceService.checkEligibility(user, serviceType);
            
            return ResponseEntity.ok(eligibility);
            
        } catch (Exception e) {
            log.error("Error checking insurance eligibility", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/eligibility/{serviceType}/patient/{patientId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> checkPatientEligibility(@PathVariable String serviceType,
                                                   @PathVariable Long patientId,
                                                   HttpServletRequest request) {
        try {
            User doctor = getCurrentUser(request);
            User patient = userService.findById(patientId)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));
            
            if (!patient.isPatient()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Specified user is not a patient"
                ));
            }
            
            InsuranceService.InsuranceEligibility eligibility = 
                insuranceService.checkEligibility(patient, serviceType);
            
            return ResponseEntity.ok(eligibility);
            
        } catch (Exception e) {
            log.error("Error checking patient insurance eligibility", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/providers")
    public ResponseEntity<?> getSupportedProviders() {
        try {
            List<InsuranceService.InsuranceProvider> providers = 
                insuranceService.getSupportedProviders();
            return ResponseEntity.ok(providers);
        } catch (Exception e) {
            log.error("Error getting supported insurance providers", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/verify-coverage")
    @PreAuthorize("hasRole('PATIENT') or hasRole('DOCTOR')")
    public ResponseEntity<?> verifyCoverage(@RequestBody Map<String, Object> request,
                                          HttpServletRequest httpRequest) {
        try {
            User user = getCurrentUser(httpRequest);
            String serviceType = (String) request.get("serviceType");
            Long patientId = null;
            
            // If doctor is verifying, get patient ID
            if (user.isDoctor()) {
                patientId = Long.valueOf(request.get("patientId").toString());
                user = userService.findById(patientId)
                        .orElseThrow(() -> new RuntimeException("Patient not found"));
            }
            
            InsuranceService.InsuranceEligibility eligibility = 
                insuranceService.checkEligibility(user, serviceType);
            
            Map<String, Object> response = Map.of(
                "eligible", eligibility.isEligible(),
                "coveragePercentage", eligibility.getCoveragePercentage(),
                "reason", eligibility.getReason(),
                "effectiveDate", eligibility.getEffectiveDate(),
                "expirationDate", eligibility.getExpirationDate(),
                "serviceType", serviceType,
                "patientId", user.getId()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error verifying insurance coverage", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/coverage-summary")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getCoverageSummary(HttpServletRequest request) {
        try {
            User patient = getCurrentUser(request);
            
            // Get coverage for different service types
            InsuranceService.InsuranceEligibility prescriptionCoverage = 
                insuranceService.checkEligibility(patient, "prescription");
            InsuranceService.InsuranceEligibility consultationCoverage = 
                insuranceService.checkEligibility(patient, "consultation");
            InsuranceService.InsuranceEligibility appointmentCoverage = 
                insuranceService.checkEligibility(patient, "appointment");
            
            Map<String, Object> summary = Map.of(
                "patientId", patient.getId(),
                "patientName", patient.getFullName(),
                "prescriptionCoverage", prescriptionCoverage,
                "consultationCoverage", consultationCoverage,
                "appointmentCoverage", appointmentCoverage,
                "lastUpdated", System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(summary);
            
        } catch (Exception e) {
            log.error("Error getting coverage summary", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/estimate-cost")
    @PreAuthorize("hasRole('PATIENT') or hasRole('DOCTOR')")
    public ResponseEntity<?> estimateCost(@RequestBody Map<String, Object> request,
                                        HttpServletRequest httpRequest) {
        try {
            User user = getCurrentUser(httpRequest);
            String serviceType = (String) request.get("serviceType");
            Double baseCost = Double.valueOf(request.get("baseCost").toString());
            
            Long patientId = null;
            if (user.isDoctor()) {
                patientId = Long.valueOf(request.get("patientId").toString());
                user = userService.findById(patientId)
                        .orElseThrow(() -> new RuntimeException("Patient not found"));
            }
            
            InsuranceService.InsuranceEligibility eligibility = 
                insuranceService.checkEligibility(user, serviceType);
            
            double coveragePercentage = eligibility.isEligible() ? 
                eligibility.getCoveragePercentage().doubleValue() : 0.0;
            double insuranceCoverage = baseCost * coveragePercentage;
            double patientCost = baseCost - insuranceCoverage;
            
            Map<String, Object> estimate = Map.of(
                "serviceType", serviceType,
                "baseCost", baseCost,
                "coveragePercentage", coveragePercentage,
                "insuranceCoverage", insuranceCoverage,
                "patientCost", patientCost,
                "eligible", eligibility.isEligible(),
                "patientId", user.getId()
            );
            
            return ResponseEntity.ok(estimate);
            
        } catch (Exception e) {
            log.error("Error estimating cost", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/provider-info/{providerName}")
    public ResponseEntity<?> getProviderInfo(@PathVariable String providerName) {
        try {
            List<InsuranceService.InsuranceProvider> providers = 
                insuranceService.getSupportedProviders();
            
            InsuranceService.InsuranceProvider provider = providers.stream()
                .filter(p -> p.getName().toLowerCase().contains(providerName.toLowerCase()))
                .findFirst()
                .orElse(null);
            
            if (provider == null) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> providerInfo = Map.of(
                "name", provider.getName(),
                "consultationCoverage", provider.getConsultationCoverage(),
                "prescriptionCoverage", provider.getPrescriptionCoverage(),
                "appointmentCoverage", provider.getAppointmentCoverage(),
                "supported", true
            );
            
            return ResponseEntity.ok(providerInfo);
            
        } catch (Exception e) {
            log.error("Error getting provider info", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "InsuranceService",
            "timestamp", System.currentTimeMillis(),
            "supportedProviders", insuranceService.getSupportedProviders().size()
        ));
    }

    private User getCurrentUser(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String email = jwtService.extractUsername(token);
            return userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("No valid authentication token found");
    }
}
