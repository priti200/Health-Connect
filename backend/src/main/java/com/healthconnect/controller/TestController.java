package com.healthconnect.controller;

import com.healthconnect.entity.*;
import com.healthconnect.repository.*;
import com.healthconnect.service.ChatService;
import com.healthconnect.service.VideoConsultationService;
import com.healthconnect.repository.VideoConsultationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestController {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final ChatRepository chatRepository;
    private final ChatService chatService;
    private final VideoConsultationService videoConsultationService;
    private final VideoConsultationRepository videoConsultationRepository;
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "HealthConnect Backend is running");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalDoctors", userRepository.countByRoleAndIsActiveTrue(UserRole.DOCTOR));
        stats.put("totalPatients", userRepository.countByRoleAndIsActiveTrue(UserRole.PATIENT));
        stats.put("totalAppointments", appointmentRepository.count());
        stats.put("totalChats", chatRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getTestUsers() {
        Map<String, Object> response = new HashMap<>();

        List<User> doctors = userRepository.findByRole(UserRole.DOCTOR);
        List<User> patients = userRepository.findByRole(UserRole.PATIENT);

        response.put("doctors", doctors.stream().map(this::mapUser).toList());
        response.put("patients", patients.stream().map(this::mapUser).toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/create-chat/{participantId}")
    public ResponseEntity<Map<String, Object>> createTestChat(
            @PathVariable Long participantId,
            Authentication authentication) {

        try {
            User currentUser = (User) authentication.getPrincipal();
            log.info("Creating test chat between user {} and participant {}",
                    currentUser.getId(), participantId);

            var chat = chatService.createOrGetChat(currentUser.getId(), participantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("chat", chat);
            response.put("message", "Chat created successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error creating test chat: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getTestInfo(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();

        Map<String, Object> response = new HashMap<>();
        response.put("currentUser", mapUser(currentUser));
        response.put("totalUsers", userRepository.count());
        response.put("totalAppointments", appointmentRepository.count());
        response.put("totalChats", chatRepository.count());

        // Get other users for testing
        List<Map<String, Object>> otherUsers = userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .map(this::mapUser)
                .toList();
        response.put("otherUsers", otherUsers);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/create-immediate-appointment")
    public ResponseEntity<Map<String, Object>> createImmediateAppointment(
            @RequestParam Long doctorId,
            Authentication authentication) {

        try {
            User currentUser = (User) authentication.getPrincipal();

            if (!currentUser.isPatient()) {
                throw new RuntimeException("Only patients can book appointments");
            }

            User doctor = userRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Doctor not found"));

            if (!doctor.isDoctor()) {
                throw new RuntimeException("Selected user is not a doctor");
            }

            // Create appointment for current time
            Appointment appointment = new Appointment();
            appointment.setDoctor(doctor);
            appointment.setPatient(currentUser);
            appointment.setDate(java.time.LocalDate.now());
            appointment.setStartTime(java.time.LocalTime.now());
            appointment.setEndTime(java.time.LocalTime.now().plusMinutes(30));
            appointment.setType(AppointmentType.VIDEO_CALL);
            appointment.setStatus(AppointmentStatus.CONFIRMED);
            appointment.setReasonForVisit("Immediate Video Call Test");
            appointment.setCreatedAt(java.time.LocalDateTime.now());
            appointment.setUpdatedAt(java.time.LocalDateTime.now());

            appointment = appointmentRepository.save(appointment);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("appointment", appointment);
            response.put("message", "Immediate appointment created for video call testing");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error creating immediate appointment: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/check-appointments")
    public ResponseEntity<?> checkAppointments() {
        try {
            // Get all appointments for today
            List<Appointment> todayAppointments = appointmentRepository.findAll().stream()
                    .filter(apt -> apt.getDate().equals(java.time.LocalDate.now()))
                    .collect(java.util.stream.Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("today", java.time.LocalDate.now().toString());
            response.put("totalAppointments", appointmentRepository.count());
            response.put("todayAppointments", todayAppointments.size());
            response.put("appointments", todayAppointments);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error checking appointments", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/video-demo")
    public ResponseEntity<Map<String, Object>> getVideoDemoInfo() {
        try {
            // Get the latest video consultation
            User patient = userRepository.findByEmail("patient.test@healthconnect.com")
                .orElseThrow(() -> new RuntimeException("Test patient not found"));
            User doctor = userRepository.findByEmail("doctor.test@healthconnect.com")
                .orElseThrow(() -> new RuntimeException("Test doctor not found"));

            // Find the latest consultation
            VideoConsultation consultation = videoConsultationRepository.findAll()
                .stream()
                .filter(c -> c.getPatient().getId().equals(patient.getId()) &&
                           c.getDoctor().getId().equals(doctor.getId()))
                .findFirst()
                .orElse(null);

            if (consultation == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "No demo consultation found. Create one first using /create-demo-video-consultation"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("consultationId", consultation.getId());
            response.put("roomId", consultation.getRoomId());
            response.put("patientUrl", "http://localhost:4200/telemedicine/consultation/" + consultation.getId());
            response.put("doctorUrl", "http://localhost:4200/telemedicine/consultation/" + consultation.getId());
            response.put("message", "Demo video consultation info");
            response.put("instructions", Map.of(
                "step1", "Login as patient: patient.test@healthconnect.com / password123",
                "step2", "Go to: " + "http://localhost:4200/telemedicine/consultation/" + consultation.getId(),
                "step3", "Click 'Join Consultation' to start video calling",
                "step4", "Allow camera and microphone access",
                "step5", "Video call will be active with your camera feed!"
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting video demo info: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Failed to get demo info: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/create-demo-video-consultation")
    public ResponseEntity<Map<String, Object>> createDemoVideoConsultation() {
        try {
            // Get test users
            User patient = userRepository.findByEmail("patient.test@healthconnect.com")
                .orElseThrow(() -> new RuntimeException("Test patient not found"));
            User doctor = userRepository.findByEmail("doctor.test@healthconnect.com")
                .orElseThrow(() -> new RuntimeException("Test doctor not found"));

            // Create appointment for now
            Appointment appointment = new Appointment();
            appointment.setPatient(patient);
            appointment.setDoctor(doctor);
            appointment.setDate(java.time.LocalDate.now());
            appointment.setStartTime(java.time.LocalTime.now());
            appointment.setEndTime(java.time.LocalTime.now().plusMinutes(30));
            appointment.setType(AppointmentType.VIDEO_CALL);
            appointment.setStatus(AppointmentStatus.CONFIRMED);
            appointment.setReasonForVisit("Demo video consultation");
            appointment.setCreatedAt(java.time.LocalDateTime.now());
            appointment.setUpdatedAt(java.time.LocalDateTime.now());

            appointment = appointmentRepository.save(appointment);

            // Create video consultation
            VideoConsultation consultation = new VideoConsultation();
            consultation.setAppointment(appointment);
            consultation.setPatient(patient);
            consultation.setDoctor(doctor);
            consultation.setScheduledStartTime(java.time.LocalDateTime.now());
            consultation.setRoomId("demo_room_" + System.currentTimeMillis());
            consultation.setType(VideoConsultation.ConsultationType.ROUTINE_CHECKUP);
            consultation.setStatus(VideoConsultation.ConsultationStatus.SCHEDULED);
            consultation.setChatEnabled(true);
            consultation.setScreenSharingEnabled(true);
            consultation.setRecordingEnabled(false);
            consultation.setCreatedAt(java.time.LocalDateTime.now());
            consultation.setUpdatedAt(java.time.LocalDateTime.now());

            consultation = videoConsultationRepository.save(consultation);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("appointmentId", appointment.getId());
            response.put("consultationId", consultation.getId());
            response.put("roomId", consultation.getRoomId());
            response.put("patientUrl", "http://localhost:4200/telemedicine/consultation/" + consultation.getId());
            response.put("doctorUrl", "http://localhost:4200/telemedicine/consultation/" + consultation.getId());
            response.put("message", "Demo video consultation created successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error creating demo video consultation: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Failed to create demo consultation: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/create-room-1-consultation")
    public ResponseEntity<Map<String, Object>> createRoom1Consultation() {
        try {
            // Get test users
            User patient = userRepository.findByEmail("patient.test@healthconnect.com")
                .orElseThrow(() -> new RuntimeException("Test patient not found"));
            User doctor = userRepository.findByEmail("doctor.test@healthconnect.com")
                .orElseThrow(() -> new RuntimeException("Test doctor not found"));

            // Create appointment for now
            Appointment appointment = new Appointment();
            appointment.setPatient(patient);
            appointment.setDoctor(doctor);
            appointment.setDate(java.time.LocalDate.now());
            appointment.setStartTime(java.time.LocalTime.now());
            appointment.setEndTime(java.time.LocalTime.now().plusMinutes(30));
            appointment.setType(AppointmentType.VIDEO_CALL);
            appointment.setStatus(AppointmentStatus.CONFIRMED);
            appointment.setReasonForVisit("Demo video consultation with room ID 1");
            appointment.setCreatedAt(java.time.LocalDateTime.now());
            appointment.setUpdatedAt(java.time.LocalDateTime.now());

            appointment = appointmentRepository.save(appointment);

            // Create video consultation with specific room ID "1"
            VideoConsultation consultation = new VideoConsultation();
            consultation.setAppointment(appointment);
            consultation.setPatient(patient);
            consultation.setDoctor(doctor);
            consultation.setScheduledStartTime(java.time.LocalDateTime.now());
            consultation.setRoomId("1"); // Specific room ID for testing
            consultation.setSessionId("agora-session-1");
            consultation.setType(VideoConsultation.ConsultationType.ROUTINE_CHECKUP);
            consultation.setStatus(VideoConsultation.ConsultationStatus.SCHEDULED);
            consultation.setChatEnabled(true);
            consultation.setScreenSharingEnabled(true);
            consultation.setRecordingEnabled(false);
            consultation.setCreatedAt(java.time.LocalDateTime.now());
            consultation.setUpdatedAt(java.time.LocalDateTime.now());

            consultation = videoConsultationRepository.save(consultation);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("appointmentId", appointment.getId());
            response.put("consultationId", consultation.getId());
            response.put("roomId", consultation.getRoomId());
            response.put("message", "Video consultation with room ID '1' created successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error creating room 1 consultation: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Failed to create room 1 consultation: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    private Map<String, Object> mapUser(User user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("fullName", user.getFullName());
        userMap.put("email", user.getEmail());
        userMap.put("role", user.getRole());
        userMap.put("specialization", user.getSpecialization());
        return userMap;
    }
}
