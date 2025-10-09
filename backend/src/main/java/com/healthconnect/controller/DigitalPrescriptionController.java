package com.healthconnect.controller;

import com.healthconnect.entity.DigitalPrescription;
import com.healthconnect.entity.User;
import com.healthconnect.service.DigitalPrescriptionService;
import com.healthconnect.service.JwtService;
import com.healthconnect.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/digital-prescription")
@RequiredArgsConstructor
@Slf4j
public class DigitalPrescriptionController {
    
    private final DigitalPrescriptionService prescriptionService;
    private final UserService userService;
    private final JwtService jwtService;
    
    @PostMapping("/create")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> createPrescription(@RequestBody DigitalPrescription prescription, 
                                              HttpServletRequest request) {
        try {
            User doctor = getCurrentUser(request);
            DigitalPrescription createdPrescription = prescriptionService.createPrescription(prescription, doctor);
            return ResponseEntity.ok(createdPrescription);
        } catch (Exception e) {
            log.error("Error creating prescription", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{prescriptionId}/issue")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> issuePrescription(@PathVariable Long prescriptionId, 
                                             HttpServletRequest request) {
        try {
            User doctor = getCurrentUser(request);
            DigitalPrescription issuedPrescription = prescriptionService.issuePrescription(prescriptionId, doctor);
            return ResponseEntity.ok(issuedPrescription);
        } catch (Exception e) {
            log.error("Error issuing prescription", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{prescriptionId}/send-to-pharmacy")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('PATIENT')")
    public ResponseEntity<?> sendToPharmacy(@PathVariable Long prescriptionId,
                                          @RequestBody Map<String, String> pharmacyInfo,
                                          HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            DigitalPrescription prescription = prescriptionService.sendToPharmacy(
                prescriptionId,
                pharmacyInfo.get("pharmacyName"),
                pharmacyInfo.get("pharmacyAddress"),
                pharmacyInfo.get("pharmacyPhone"),
                user
            );
            return ResponseEntity.ok(prescription);
        } catch (Exception e) {
            log.error("Error sending prescription to pharmacy", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{prescriptionId}/refill")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> requestRefill(@PathVariable Long prescriptionId, 
                                         HttpServletRequest request) {
        try {
            User patient = getCurrentUser(request);
            DigitalPrescription prescription = prescriptionService.requestRefill(prescriptionId, patient);
            return ResponseEntity.ok(prescription);
        } catch (Exception e) {
            log.error("Error requesting refill", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{prescriptionId}/cancel")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> cancelPrescription(@PathVariable Long prescriptionId,
                                              @RequestBody Map<String, String> request,
                                              HttpServletRequest httpRequest) {
        try {
            User doctor = getCurrentUser(httpRequest);
            String reason = request.get("reason");
            DigitalPrescription prescription = prescriptionService.cancelPrescription(prescriptionId, reason, doctor);
            return ResponseEntity.ok(prescription);
        } catch (Exception e) {
            log.error("Error cancelling prescription", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{prescriptionId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('PATIENT')")
    public ResponseEntity<?> getPrescription(@PathVariable Long prescriptionId, 
                                           HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            DigitalPrescription prescription = prescriptionService.getPrescription(prescriptionId, user);
            return ResponseEntity.ok(prescription);
        } catch (Exception e) {
            log.error("Error getting prescription", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/doctor/prescriptions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getDoctorPrescriptions(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size,
                                                   HttpServletRequest request) {
        try {
            User doctor = getCurrentUser(request);
            Pageable pageable = PageRequest.of(page, size);
            Page<DigitalPrescription> prescriptions = prescriptionService.getDoctorPrescriptions(doctor, pageable);
            return ResponseEntity.ok(prescriptions);
        } catch (Exception e) {
            log.error("Error getting doctor prescriptions", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/patient/prescriptions")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getPatientPrescriptions(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size,
                                                    HttpServletRequest request) {
        try {
            User patient = getCurrentUser(request);
            Pageable pageable = PageRequest.of(page, size);
            Page<DigitalPrescription> prescriptions = prescriptionService.getPatientPrescriptions(patient, pageable);
            return ResponseEntity.ok(prescriptions);
        } catch (Exception e) {
            log.error("Error getting patient prescriptions", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/patient/active")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getActivePrescriptions(HttpServletRequest request) {
        try {
            User patient = getCurrentUser(request);
            List<DigitalPrescription> prescriptions = prescriptionService.getActivePrescriptions(patient);
            return ResponseEntity.ok(prescriptions);
        } catch (Exception e) {
            log.error("Error getting active prescriptions", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/patient/expiring")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getExpiringPrescriptions(@RequestParam(defaultValue = "7") int daysAhead,
                                                     HttpServletRequest request) {
        try {
            User patient = getCurrentUser(request);
            List<DigitalPrescription> prescriptions = prescriptionService.getExpiringPrescriptions(patient, daysAhead);
            return ResponseEntity.ok(prescriptions);
        } catch (Exception e) {
            log.error("Error getting expiring prescriptions", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/types")
    public ResponseEntity<?> getPrescriptionTypes() {
        try {
            return ResponseEntity.ok(DigitalPrescription.PrescriptionType.values());
        } catch (Exception e) {
            log.error("Error getting prescription types", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/medications/search")
    public ResponseEntity<?> searchMedications(@RequestParam String q) {
        try {
            // Mock medication search - in real implementation, this would query a medication database
            List<Map<String, Object>> medications = List.of(
                Map.of("name", "Amoxicillin", "genericName", "Amoxicillin", "strength", "500mg"),
                Map.of("name", "Ibuprofen", "genericName", "Ibuprofen", "strength", "200mg"),
                Map.of("name", "Lisinopril", "genericName", "Lisinopril", "strength", "10mg"),
                Map.of("name", "Metformin", "genericName", "Metformin", "strength", "500mg"),
                Map.of("name", "Atorvastatin", "genericName", "Atorvastatin", "strength", "20mg")
            );
            
            List<Map<String, Object>> filteredMedications = medications.stream()
                .filter(med -> med.get("name").toString().toLowerCase().contains(q.toLowerCase()))
                .toList();
                
            return ResponseEntity.ok(filteredMedications);
        } catch (Exception e) {
            log.error("Error searching medications", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/interactions/check")
    public ResponseEntity<?> checkDrugInteractions(@RequestBody Map<String, List<String>> request) {
        try {
            List<String> medications = request.get("medications");
            
            // Mock drug interaction check - in real implementation, this would use a drug interaction database
            Map<String, Object> result = Map.of(
                "hasInteractions", false,
                "interactions", List.of(),
                "warnings", List.of("Always take medications as prescribed by your doctor")
            );
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error checking drug interactions", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "DigitalPrescriptionService",
            "timestamp", System.currentTimeMillis()
        ));
    }
    
    private User getCurrentUser(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String userEmail = jwtService.extractUsername(token);
            return userService.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("No valid authentication token found");
    }
}
