package com.healthconnect.service;

import com.healthconnect.entity.VideoConsultation;
import com.healthconnect.entity.DigitalPrescription;
import com.healthconnect.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class NotificationService {

    private SimpMessagingTemplate messagingTemplate;

    @Autowired(required = false)
    public void setMessagingTemplate(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    public void sendConsultationCreatedNotification(VideoConsultation consultation) {
        log.info("Sending consultation created notification for consultation: {}", consultation.getId());
        
        // Notify doctor
        Map<String, Object> doctorNotification = createNotificationData(
            "VIDEO_CONSULTATION_CREATED",
            "New Video Consultation Scheduled",
            String.format("Video consultation with %s scheduled for %s",
                consultation.getPatient().getFullName(),
                consultation.getScheduledStartTime()),
            consultation.getId()
        );
        
        sendNotificationToUser(consultation.getDoctor().getId(), doctorNotification);
        
        // Notify patient
        Map<String, Object> patientNotification = createNotificationData(
            "VIDEO_CONSULTATION_CREATED",
            "Video Consultation Scheduled",
            String.format("Video consultation with Dr. %s scheduled for %s",
                consultation.getDoctor().getFullName(),
                consultation.getScheduledStartTime()),
            consultation.getId()
        );
        
        sendNotificationToUser(consultation.getPatient().getId(), patientNotification);
    }
    
    public void sendConsultationCompletedNotification(VideoConsultation consultation) {
        log.info("Sending consultation completed notification for consultation: {}", consultation.getId());
        
        // Notify patient
        Map<String, Object> patientNotification = createNotificationData(
            "VIDEO_CONSULTATION_COMPLETED",
            "Video Consultation Completed",
            String.format("Your video consultation with Dr. %s has been completed. Duration: %d minutes",
                consultation.getDoctor().getFullName(),
                consultation.getDurationMinutes()),
            consultation.getId()
        );
        
        sendNotificationToUser(consultation.getPatient().getId(), patientNotification);
    }
    
    public void sendConsultationStartingNotification(VideoConsultation consultation) {
        log.info("Sending consultation starting notification for consultation: {}", consultation.getId());
        
        // Notify both doctor and patient
        Map<String, Object> notification = createNotificationData(
            "VIDEO_CONSULTATION_STARTING",
            "Video Consultation Starting",
            "Your video consultation is about to begin. Please join the meeting room.",
            consultation.getId()
        );
        
        sendNotificationToUser(consultation.getDoctor().getId(), notification);
        sendNotificationToUser(consultation.getPatient().getId(), notification);
    }
    
    public void sendPrescriptionIssuedNotification(DigitalPrescription prescription) {
        log.info("Sending prescription issued notification for prescription: {}", prescription.getId());
        
        Map<String, Object> notification = createNotificationData(
            "PRESCRIPTION_ISSUED",
            "New Prescription Issued",
            String.format("Dr. %s has issued a new prescription for you. Prescription #%s",
                prescription.getDoctor().getFullName(),
                prescription.getPrescriptionNumber()),
            prescription.getId()
        );
        
        sendNotificationToUser(prescription.getPatient().getId(), notification);
    }
    
    public void sendPrescriptionExpiringNotification(DigitalPrescription prescription) {
        log.info("Sending prescription expiring notification for prescription: {}", prescription.getId());
        
        Map<String, Object> notification = createNotificationData(
            "PRESCRIPTION_EXPIRING",
            "Prescription Expiring Soon",
            String.format("Your prescription #%s will expire on %s. Please contact your doctor for renewal.", 
                prescription.getPrescriptionNumber(),
                prescription.getExpiryDate()),
            prescription.getId()
        );
        
        sendNotificationToUser(prescription.getPatient().getId(), notification);
    }
    
    public void sendUrgentHealthAlertNotification(User user, String title, String message) {
        log.info("Sending urgent health alert notification to user: {}", user.getId());
        
        Map<String, Object> notification = createNotificationData(
            "URGENT_HEALTH_ALERT",
            title,
            message,
            null
        );
        notification.put("priority", "URGENT");
        
        sendNotificationToUser(user.getId(), notification);
    }
    
    public void sendAppointmentReminderNotification(User user, String appointmentDetails) {
        log.info("Sending appointment reminder notification to user: {}", user.getId());
        
        Map<String, Object> notification = createNotificationData(
            "APPOINTMENT_REMINDER",
            "Appointment Reminder",
            appointmentDetails,
            null
        );
        
        sendNotificationToUser(user.getId(), notification);
    }
    
    public void sendSystemMaintenanceNotification(String message) {
        log.info("Sending system maintenance notification");
        
        Map<String, Object> notification = createNotificationData(
            "SYSTEM_MAINTENANCE",
            "System Maintenance Notice",
            message,
            null
        );
        
        // Broadcast to all users
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/notifications/broadcast", notification);
        } else {
            log.debug("WebSocket not enabled, skipping system maintenance notification broadcast");
        }
    }
    
    public void sendChatMessageNotification(User recipient, User sender, String messagePreview) {
        log.info("Sending chat message notification to user: {} from user: {}", recipient.getId(), sender.getId());
        
        Map<String, Object> notification = createNotificationData(
            "NEW_CHAT_MESSAGE",
            "New Message",
            String.format("%s: %s",
                sender.getFullName(),
                messagePreview),
            null
        );
        notification.put("senderId", sender.getId());
        notification.put("senderName", sender.getFullName());
        
        sendNotificationToUser(recipient.getId(), notification);
    }
    
    public void sendTestResultsNotification(User patient, String testName) {
        log.info("Sending test results notification to patient: {}", patient.getId());
        
        Map<String, Object> notification = createNotificationData(
            "TEST_RESULTS_AVAILABLE",
            "Test Results Available",
            String.format("Your %s test results are now available. Please check your patient portal.", testName),
            null
        );
        
        sendNotificationToUser(patient.getId(), notification);
    }
    
    private Map<String, Object> createNotificationData(String type, String title, String message, Long relatedId) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", type);
        notification.put("title", title);
        notification.put("message", message);
        notification.put("timestamp", System.currentTimeMillis());
        notification.put("read", false);
        notification.put("priority", "MEDIUM");
        
        if (relatedId != null) {
            notification.put("relatedId", relatedId);
        }
        
        return notification;
    }
    
    private void sendNotificationToUser(Long userId, Map<String, Object> notification) {
        if (messagingTemplate == null) {
            log.debug("WebSocket not enabled, skipping notification to user: {}", userId);
            return;
        }

        try {
            String destination = "/topic/notifications/user/" + userId;
            messagingTemplate.convertAndSend(destination, notification);
            log.debug("Notification sent to user {} at destination: {}", userId, destination);
        } catch (Exception e) {
            log.error("Failed to send notification to user {}: {}", userId, e.getMessage());
        }
    }
    
    // Real-time status updates
    public void sendUserStatusUpdate(Long userId, String status) {
        if (messagingTemplate == null) {
            log.debug("WebSocket not enabled, skipping user status update for user: {}", userId);
            return;
        }

        Map<String, Object> statusUpdate = new HashMap<>();
        statusUpdate.put("userId", userId);
        statusUpdate.put("status", status);
        statusUpdate.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/status/user/" + userId, statusUpdate);
    }

    public void sendDoctorAvailabilityUpdate(Long doctorId, String availability) {
        if (messagingTemplate == null) {
            log.debug("WebSocket not enabled, skipping doctor availability update for doctor: {}", doctorId);
            return;
        }

        Map<String, Object> availabilityUpdate = new HashMap<>();
        availabilityUpdate.put("doctorId", doctorId);
        availabilityUpdate.put("availability", availability);
        availabilityUpdate.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/availability/doctor/" + doctorId, availabilityUpdate);
        messagingTemplate.convertAndSend("/topic/availability/broadcast", availabilityUpdate);
    }
}
