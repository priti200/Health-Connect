package com.healthconnect.service;

import com.healthconnect.entity.Appointment;
import com.healthconnect.entity.User;
import com.healthconnect.entity.VideoConsultation;
import com.healthconnect.repository.VideoConsultationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoConsultationService {
    
    private final VideoConsultationRepository consultationRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    
    @Transactional
    public VideoConsultation createConsultation(Appointment appointment, VideoConsultation.ConsultationType type) {
        log.info("Creating video consultation for appointment: {}", appointment.getId());
        
        // Check if consultation already exists
        var existing = consultationRepository.findByAppointmentId(appointment.getId());
        if (existing.isPresent()) {
            log.info("Returning existing video consultation for appointment: {}", appointment.getId());
            return existing.get();
        }
        
        String roomId = generateRoomId();
        String sessionId = "agora-session-" + roomId; // Simple session ID for Agora
        
        VideoConsultation consultation = VideoConsultation.builder()
                .appointment(appointment)
                .doctor(appointment.getDoctor())
                .patient(appointment.getPatient())
                .roomId(roomId)
                .sessionId(sessionId)
                .status(VideoConsultation.ConsultationStatus.SCHEDULED)
                .type(type)
                .scheduledStartTime(appointment.getDate().atTime(appointment.getStartTime()))
                .chatEnabled(true)
                .screenSharingEnabled(true)
                .recordingEnabled(false)
                .recordingConsent(false)
                .build();
        
        consultation = consultationRepository.save(consultation);

        // Audit log
        auditService.logVideoConsultationAccess(appointment.getPatient(), consultation.getId().toString(),
                "Created video consultation for appointment " + appointment.getId());
        auditService.logVideoConsultationAccess(appointment.getDoctor(), consultation.getId().toString(),
                "Video consultation created for patient " + appointment.getPatient().getFullName());

        // Send notifications
        notificationService.sendConsultationCreatedNotification(consultation);

        return consultation;
    }
    
    @Transactional
    public VideoConsultation startConsultation(Long consultationId, User user) {
        VideoConsultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("Consultation not found"));
        
        LocalDateTime now = LocalDateTime.now();
        
        // Check if user is authorized
        if (!consultation.getDoctor().getId().equals(user.getId()) && 
            !consultation.getPatient().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to consultation");
        }
        
        // Update join times
        if (consultation.getDoctor().getId().equals(user.getId())) {
            consultation.setDoctorJoinTime(now);
            if (consultation.getStatus() == VideoConsultation.ConsultationStatus.SCHEDULED) {
                consultation.setStatus(VideoConsultation.ConsultationStatus.WAITING_FOR_PATIENT);
            }
        } else {
            consultation.setPatientJoinTime(now);
            if (consultation.getStatus() == VideoConsultation.ConsultationStatus.SCHEDULED) {
                consultation.setStatus(VideoConsultation.ConsultationStatus.WAITING_FOR_DOCTOR);
            }
        }
        
        // If both have joined, start the consultation
        if (consultation.getDoctorJoinTime() != null && consultation.getPatientJoinTime() != null) {
            consultation.setStatus(VideoConsultation.ConsultationStatus.IN_PROGRESS);
            consultation.setActualStartTime(now);
            // Audit log for consultation start
            auditService.logVideoConsultationStart(user, consultation.getId().toString());
        }

        consultation = consultationRepository.save(consultation);

        // Audit log for joining
        auditService.logVideoConsultationAccess(user, consultation.getId().toString(),
                "Joined video consultation room " + consultation.getRoomId());

        // User can now join Agora room with room ID
        log.info("User {} can join Agora room: {}", user.getEmail(), consultation.getRoomId());

        return consultation;
    }
    
    @Transactional
    public VideoConsultation endConsultation(Long consultationId, User user, String notes, String diagnosis, String recommendations) {
        VideoConsultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("Consultation not found"));
        
        // Only doctor can end consultation
        if (!consultation.getDoctor().getId().equals(user.getId())) {
            throw new RuntimeException("Only the doctor can end the consultation");
        }
        
        LocalDateTime now = LocalDateTime.now();
        consultation.setEndTime(now);
        consultation.setStatus(VideoConsultation.ConsultationStatus.COMPLETED);
        consultation.setNotes(notes);
        consultation.setDiagnosis(diagnosis);
        consultation.setRecommendations(recommendations);
        
        // Calculate duration
        if (consultation.getActualStartTime() != null) {
            long minutes = java.time.Duration.between(consultation.getActualStartTime(), now).toMinutes();
            consultation.setDurationMinutes((int) minutes);
        }
        
        consultation = consultationRepository.save(consultation);

        // Audit log for consultation end
        String duration = consultation.getDurationMinutes() != null ?
                consultation.getDurationMinutes() + " minutes" : "unknown";
        auditService.logVideoConsultationEnd(user, consultation.getId().toString(), duration);

        // Agora room will be automatically cleaned up when participants leave
        log.info("Video consultation ended for room: {}", consultation.getRoomId());

        // Send completion notifications
        notificationService.sendConsultationCompletedNotification(consultation);

        return consultation;
    }
    
    @Transactional
    public VideoConsultation updateConsultationSettings(Long consultationId, User user, ConsultationSettings settings) {
        VideoConsultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("Consultation not found"));
        
        // Only doctor can update settings
        if (!consultation.getDoctor().getId().equals(user.getId())) {
            throw new RuntimeException("Only the doctor can update consultation settings");
        }
        
        consultation.setRecordingEnabled(settings.isRecordingEnabled());
        consultation.setScreenSharingEnabled(settings.isScreenSharingEnabled());
        consultation.setChatEnabled(settings.isChatEnabled());
        
        return consultationRepository.save(consultation);
    }
    
    public VideoConsultation getConsultationByRoomId(String roomId) {
        return consultationRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RuntimeException("Consultation not found"));
    }
    
    public List<VideoConsultation> getDoctorConsultations(User doctor) {
        return consultationRepository.findByDoctorOrderByScheduledStartTimeDesc(doctor);
    }
    
    public List<VideoConsultation> getPatientConsultations(User patient) {
        return consultationRepository.findByPatientOrderByScheduledStartTimeDesc(patient);
    }
    
    public List<VideoConsultation> getUpcomingConsultations(User user) {
        LocalDateTime now = LocalDateTime.now();
        if (user.isDoctor()) {
            return consultationRepository.findUpcomingConsultationsForDoctor(user, now);
        } else {
            return consultationRepository.findUpcomingConsultationsForPatient(user, now);
        }
    }

    public VideoConsultation getConsultationByAppointmentId(Long appointmentId, User user) {
        VideoConsultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new RuntimeException("Consultation not found for appointment"));

        // Check if user is authorized to view this consultation
        if (!consultation.getDoctor().getId().equals(user.getId()) &&
            !consultation.getPatient().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to consultation");
        }

        return consultation;
    }
    
    @Transactional
    public VideoConsultation submitFeedback(Long consultationId, User user, int qualityRating, int satisfaction, String feedback) {
        VideoConsultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("Consultation not found"));
        
        if (consultation.getDoctor().getId().equals(user.getId())) {
            consultation.setQualityRating(qualityRating);
            consultation.setDoctorNotes(feedback);
        } else if (consultation.getPatient().getId().equals(user.getId())) {
            consultation.setPatientSatisfaction(satisfaction);
            consultation.setPatientFeedback(feedback);
        } else {
            throw new RuntimeException("Unauthorized access to consultation");
        }
        
        return consultationRepository.save(consultation);
    }
    
    private String generateRoomId() {
        return "room_" + UUID.randomUUID().toString().replace("-", "");
    }
    
    // Helper classes
    public static class ConsultationSettings {
        private boolean recordingEnabled;
        private boolean screenSharingEnabled;
        private boolean chatEnabled;

        // Constructors
        public ConsultationSettings() {}

        public ConsultationSettings(boolean recordingEnabled, boolean screenSharingEnabled, boolean chatEnabled) {
            this.recordingEnabled = recordingEnabled;
            this.screenSharingEnabled = screenSharingEnabled;
            this.chatEnabled = chatEnabled;
        }

        // Getters and setters
        public boolean isRecordingEnabled() { return recordingEnabled; }
        public void setRecordingEnabled(boolean recordingEnabled) { this.recordingEnabled = recordingEnabled; }
        public boolean isScreenSharingEnabled() { return screenSharingEnabled; }
        public void setScreenSharingEnabled(boolean screenSharingEnabled) { this.screenSharingEnabled = screenSharingEnabled; }
        public boolean isChatEnabled() { return chatEnabled; }
        public void setChatEnabled(boolean chatEnabled) { this.chatEnabled = chatEnabled; }
    }
}
