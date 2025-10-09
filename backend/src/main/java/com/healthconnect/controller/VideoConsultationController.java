package com.healthconnect.controller;

import com.healthconnect.entity.Appointment;
import com.healthconnect.entity.User;
import com.healthconnect.entity.VideoConsultation;
import com.healthconnect.service.AppointmentService;
import com.healthconnect.service.VideoConsultationService;

import com.healthconnect.repository.VideoConsultationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/video-consultation")
@RequiredArgsConstructor
@Slf4j
public class VideoConsultationController {
    
    private final VideoConsultationService videoConsultationService;
    private final AppointmentService appointmentService;
    private final VideoConsultationRepository consultationRepository;
    
    // Create consultation
    @PostMapping("/create")
    public ResponseEntity<VideoConsultation> createConsultation(
            @Valid @RequestBody CreateConsultationRequest request,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        log.info("Creating video consultation for appointment: {} by user: {}", 
                request.getAppointmentId(), currentUser.getEmail());
        
        try {
            // First get the appointment
            Appointment appointment = appointmentService.getAppointmentById(request.getAppointmentId(), currentUser)
                    .orElseThrow(() -> new RuntimeException("Appointment not found or access denied"));
            VideoConsultation consultation = videoConsultationService.createConsultation(
                    appointment,
                    VideoConsultation.ConsultationType.valueOf(request.getType())
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(consultation);
        } catch (Exception e) {
            log.error("Error creating consultation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Start consultation
    @PostMapping("/{consultationId}/start")
    public ResponseEntity<VideoConsultation> startConsultation(
            @PathVariable Long consultationId,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        log.info("Starting consultation: {} by user: {}", consultationId, currentUser.getEmail());
        
        try {
            VideoConsultation consultation = videoConsultationService.startConsultation(consultationId, currentUser);
            return ResponseEntity.ok(consultation);
        } catch (Exception e) {
            log.error("Error starting consultation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // End consultation
    @PostMapping("/{consultationId}/end")
    public ResponseEntity<VideoConsultation> endConsultation(
            @PathVariable Long consultationId,
            @Valid @RequestBody EndConsultationRequest request,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        log.info("Ending consultation: {} by user: {}", consultationId, currentUser.getEmail());
        
        try {
            VideoConsultation consultation = videoConsultationService.endConsultation(
                    consultationId, 
                    currentUser, 
                    request.getNotes(),
                    request.getDiagnosis(),
                    request.getRecommendations()
            );
            return ResponseEntity.ok(consultation);
        } catch (Exception e) {
            log.error("Error ending consultation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Get consultation by ID
    @GetMapping("/{consultationId}")
    public ResponseEntity<VideoConsultation> getConsultation(
            @PathVariable Long consultationId,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            VideoConsultation consultation = consultationRepository.findById(consultationId)
                    .orElseThrow(() -> new RuntimeException("Consultation not found"));
            
            // Check if user is authorized to view this consultation
            if (!consultation.getDoctor().getId().equals(currentUser.getId()) && 
                !consultation.getPatient().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            return ResponseEntity.ok(consultation);
        } catch (Exception e) {
            log.error("Error fetching consultation: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    // Get consultation by room ID
    @GetMapping("/room/{roomId}")
    public ResponseEntity<VideoConsultation> getConsultationByRoomId(
            @PathVariable String roomId,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            VideoConsultation consultation = videoConsultationService.getConsultationByRoomId(roomId);
            
            // Check if user is authorized to view this consultation
            if (!consultation.getDoctor().getId().equals(currentUser.getId()) && 
                !consultation.getPatient().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            return ResponseEntity.ok(consultation);
        } catch (Exception e) {
            log.error("Error fetching consultation by room ID: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    // Get all consultations for current user (root endpoint)
    @GetMapping
    public ResponseEntity<List<VideoConsultation>> getAllConsultations(
            Authentication authentication) {

        User currentUser = (User) authentication.getPrincipal();

        try {
            List<VideoConsultation> consultations;
            if (currentUser.isDoctor()) {
                consultations = videoConsultationService.getDoctorConsultations(currentUser);
            } else {
                consultations = videoConsultationService.getPatientConsultations(currentUser);
            }
            return ResponseEntity.ok(consultations);
        } catch (Exception e) {
            log.error("Error fetching consultations: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Get user consultations
    @GetMapping("/user/consultations")
    public ResponseEntity<List<VideoConsultation>> getUserConsultations(
            Authentication authentication) {

        User currentUser = (User) authentication.getPrincipal();

        try {
            List<VideoConsultation> consultations;
            if (currentUser.isDoctor()) {
                consultations = videoConsultationService.getDoctorConsultations(currentUser);
            } else {
                consultations = videoConsultationService.getPatientConsultations(currentUser);
            }
            return ResponseEntity.ok(consultations);
        } catch (Exception e) {
            log.error("Error fetching user consultations: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Get upcoming consultations
    @GetMapping("/user/upcoming")
    public ResponseEntity<List<VideoConsultation>> getUpcomingConsultations(
            Authentication authentication) {

        User currentUser = (User) authentication.getPrincipal();

        try {
            List<VideoConsultation> consultations = videoConsultationService.getUpcomingConsultations(currentUser);
            return ResponseEntity.ok(consultations);
        } catch (Exception e) {
            log.error("Error fetching upcoming consultations: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Get consultation by appointment ID
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<VideoConsultation> getConsultationByAppointmentId(
            @PathVariable Long appointmentId,
            Authentication authentication) {

        User currentUser = (User) authentication.getPrincipal();

        try {
            VideoConsultation consultation = videoConsultationService.getConsultationByAppointmentId(appointmentId, currentUser);
            return ResponseEntity.ok(consultation);
        } catch (Exception e) {
            log.error("Error getting consultation by appointment ID: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    // Update consultation settings
    @PutMapping("/{consultationId}/settings")
    public ResponseEntity<VideoConsultation> updateConsultationSettings(
            @PathVariable Long consultationId,
            @Valid @RequestBody ConsultationSettingsRequest request,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            VideoConsultationService.ConsultationSettings settings = 
                    new VideoConsultationService.ConsultationSettings(
                            request.isRecordingEnabled(),
                            request.isScreenSharingEnabled(),
                            request.isChatEnabled()
                    );
            
            VideoConsultation consultation = videoConsultationService.updateConsultationSettings(
                    consultationId, currentUser, settings);
            return ResponseEntity.ok(consultation);
        } catch (Exception e) {
            log.error("Error updating consultation settings: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Submit feedback
    @PostMapping("/{consultationId}/feedback")
    public ResponseEntity<VideoConsultation> submitFeedback(
            @PathVariable Long consultationId,
            @Valid @RequestBody FeedbackRequest request,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            VideoConsultation consultation = videoConsultationService.submitFeedback(
                    consultationId, 
                    currentUser, 
                    request.getQualityRating(),
                    request.getSatisfaction(),
                    request.getFeedback()
            );
            return ResponseEntity.ok(consultation);
        } catch (Exception e) {
            log.error("Error submitting feedback: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Get Twilio access token for video room
    @GetMapping("/{consultationId}/token")
    public ResponseEntity<Map<String, String>> getAccessToken(
            @PathVariable Long consultationId,
            Authentication authentication) {

        User currentUser = (User) authentication.getPrincipal();

        try {
            VideoConsultation consultation = consultationRepository.findById(consultationId)
                    .orElseThrow(() -> new RuntimeException("Consultation not found"));

            // Check if user is authorized to join this consultation
            if (!consultation.getDoctor().getId().equals(currentUser.getId()) &&
                !consultation.getPatient().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Generate simple demo token for video calling
            String accessToken = "demo_token_" + currentUser.getId() + "_" + System.currentTimeMillis();

            return ResponseEntity.ok(Map.of(
                    "accessToken", accessToken,
                    "roomName", consultation.getRoomId(),
                    "identity", currentUser.getRole().name().toLowerCase() + "_" + currentUser.getId(),
                    "userId", currentUser.getId().toString(),
                    "userName", currentUser.getFullName(),
                    "userRole", currentUser.getRole().toString()
            ));

        } catch (Exception e) {
            log.error("Error generating access token: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Health check
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Video Consultation Service",
                "timestamp", System.currentTimeMillis()
        ));
    }
    
    // Request DTOs
    public static class CreateConsultationRequest {
        private Long appointmentId;
        private String type;
        
        // Getters and setters
        public Long getAppointmentId() { return appointmentId; }
        public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }
    
    public static class EndConsultationRequest {
        private String notes;
        private String diagnosis;
        private String recommendations;
        
        // Getters and setters
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public String getRecommendations() { return recommendations; }
        public void setRecommendations(String recommendations) { this.recommendations = recommendations; }
    }
    
    public static class ConsultationSettingsRequest {
        private boolean recordingEnabled;
        private boolean screenSharingEnabled;
        private boolean chatEnabled;
        
        // Getters and setters
        public boolean isRecordingEnabled() { return recordingEnabled; }
        public void setRecordingEnabled(boolean recordingEnabled) { this.recordingEnabled = recordingEnabled; }
        public boolean isScreenSharingEnabled() { return screenSharingEnabled; }
        public void setScreenSharingEnabled(boolean screenSharingEnabled) { this.screenSharingEnabled = screenSharingEnabled; }
        public boolean isChatEnabled() { return chatEnabled; }
        public void setChatEnabled(boolean chatEnabled) { this.chatEnabled = chatEnabled; }
    }
    
    public static class FeedbackRequest {
        private int qualityRating;
        private int satisfaction;
        private String feedback;
        
        // Getters and setters
        public int getQualityRating() { return qualityRating; }
        public void setQualityRating(int qualityRating) { this.qualityRating = qualityRating; }
        public int getSatisfaction() { return satisfaction; }
        public void setSatisfaction(int satisfaction) { this.satisfaction = satisfaction; }
        public String getFeedback() { return feedback; }
        public void setFeedback(String feedback) { this.feedback = feedback; }
    }
}
