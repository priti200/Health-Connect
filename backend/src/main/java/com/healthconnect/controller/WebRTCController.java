package com.healthconnect.controller;

import com.healthconnect.dto.WebRTCSignalRequest;
import com.healthconnect.dto.CallRecordingRequest;
import com.healthconnect.dto.CallQualityMetrics;
import com.healthconnect.service.JwtService;
import com.healthconnect.service.WebRTCService;
import com.healthconnect.service.VideoConsultationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@Controller
@RestController
@RequestMapping("/api/webrtc")
@RequiredArgsConstructor
@Slf4j
public class WebRTCController {

    private final WebRTCService webRTCService;
    private final VideoConsultationService videoConsultationService;
    private final JwtService jwtService;

    @MessageMapping("/webrtc/{roomId}/join")
    public void joinRoom(
            @DestinationVariable String roomId,
            @Payload JoinRoomRequest request) {
        try {
            // For now, use the userId from the request payload
            // In production, extract from authenticated session
            Long userId = request.getUserId();
            String userRole = request.getUserRole();

            if (userId == null) {
                log.error("User ID is required to join WebRTC room");
                return;
            }

            webRTCService.initializeUserSession(roomId, userId, userRole);

            log.info("User {} joined WebRTC room: {} as {}", userId, roomId, userRole);

        } catch (Exception e) {
            log.error("Failed to join WebRTC room: {}", e.getMessage());
        }
    }

    @MessageMapping("/webrtc/{roomId}/signal")
    public void handleSignal(
            @DestinationVariable String roomId,
            @Payload WebRTCSignalRequest signal) {
        try {
            // For now, use the userId from the signal payload
            // In production, extract from authenticated session
            Long userId = signal.getUserId();

            if (userId == null) {
                log.error("User ID is required for WebRTC signal");
                return;
            }

            webRTCService.handleWebRTCSignal(roomId, userId, signal);

            log.debug("Handled WebRTC signal from user {} in room {}: {}",
                     userId, roomId, signal.getType());

        } catch (Exception e) {
            log.error("Failed to handle WebRTC signal: {}", e.getMessage());
        }
    }

    @MessageMapping("/webrtc/{roomId}/leave")
    public void leaveRoom(
            @DestinationVariable String roomId,
            @Header("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtService.extractUserId(token);
            
            webRTCService.removeUserFromRoom(roomId, userId);
            
            log.info("User {} left WebRTC room: {}", userId, roomId);
            
        } catch (Exception e) {
            log.error("Failed to leave WebRTC room: {}", e.getMessage());
        }
    }

    @MessageMapping("/webrtc/{roomId}/end")
    public void endSession(
            @DestinationVariable String roomId,
            @Header("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtService.extractUserId(token);
            
            // TODO: Add authorization check - only doctor or session creator should be able to end
            webRTCService.endSession(roomId);
            
            log.info("User {} ended WebRTC session for room: {}", userId, roomId);
            
        } catch (Exception e) {
            log.error("Failed to end WebRTC session: {}", e.getMessage());
        }
    }

    @MessageMapping("/webrtc/{roomId}/mute")
    public void handleMute(
            @DestinationVariable String roomId,
            @Payload MuteRequest request,
            @Header("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtService.extractUserId(token);
            
            // Broadcast mute status to other participants
            MuteStatusMessage message = new MuteStatusMessage(
                userId, request.isAudioMuted(), request.isVideoMuted()
            );
            
            // This would be handled by the WebRTC service to broadcast to other peers
            // For now, we'll log it
            log.debug("User {} mute status in room {}: audio={}, video={}", 
                     userId, roomId, request.isAudioMuted(), request.isVideoMuted());
            
        } catch (Exception e) {
            log.error("Failed to handle mute request: {}", e.getMessage());
        }
    }

    // REST endpoints for recording and quality metrics
    @PostMapping("/recording/upload")
    public ResponseEntity<String> uploadRecording(
            @Valid @RequestBody CallRecordingRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtService.extractUserId(token);

            String recordingUrl = webRTCService.saveRecording(request, userId);

            log.info("Recording uploaded for consultation: {} by user: {}",
                    request.getConsultationId(), userId);

            return ResponseEntity.ok(recordingUrl);

        } catch (Exception e) {
            log.error("Failed to upload recording: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to upload recording");
        }
    }

    @PostMapping("/quality/metrics")
    public ResponseEntity<String> submitQualityMetrics(
            @Valid @RequestBody CallQualityMetrics metrics,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtService.extractUserId(token);

            webRTCService.saveQualityMetrics(metrics, userId);

            log.debug("Quality metrics submitted for consultation: {} by user: {}",
                     metrics.getConsultationId(), userId);

            return ResponseEntity.ok("Metrics saved successfully");

        } catch (Exception e) {
            log.error("Failed to save quality metrics: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to save metrics");
        }
    }

    @GetMapping("/room/{roomId}/status")
    public ResponseEntity<RoomStatusResponse> getRoomStatus(
            @PathVariable String roomId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtService.extractUserId(token);

            RoomStatusResponse status = webRTCService.getRoomStatus(roomId, userId);

            return ResponseEntity.ok(status);

        } catch (Exception e) {
            log.error("Failed to get room status: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // DTOs for WebRTC requests
    public static class JoinRoomRequest {
        private String userRole;
        private Long userId;
        private String peerId;

        public String getUserRole() { return userRole; }
        public void setUserRole(String userRole) { this.userRole = userRole; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getPeerId() { return peerId; }
        public void setPeerId(String peerId) { this.peerId = peerId; }
    }

    public static class MuteRequest {
        private boolean audioMuted;
        private boolean videoMuted;
        
        public boolean isAudioMuted() { return audioMuted; }
        public void setAudioMuted(boolean audioMuted) { this.audioMuted = audioMuted; }
        public boolean isVideoMuted() { return videoMuted; }
        public void setVideoMuted(boolean videoMuted) { this.videoMuted = videoMuted; }
    }

    public static class MuteStatusMessage {
        private Long userId;
        private boolean audioMuted;
        private boolean videoMuted;
        
        public MuteStatusMessage(Long userId, boolean audioMuted, boolean videoMuted) {
            this.userId = userId;
            this.audioMuted = audioMuted;
            this.videoMuted = videoMuted;
        }
        
        // Getters
        public Long getUserId() { return userId; }
        public boolean isAudioMuted() { return audioMuted; }
        public boolean isVideoMuted() { return videoMuted; }
    }

    public static class RoomStatusResponse {
        private String roomId;
        private int participantCount;
        private boolean isActive;
        private long sessionStartTime;
        private String sessionStatus;

        public RoomStatusResponse(String roomId, int participantCount, boolean isActive,
                                long sessionStartTime, String sessionStatus) {
            this.roomId = roomId;
            this.participantCount = participantCount;
            this.isActive = isActive;
            this.sessionStartTime = sessionStartTime;
            this.sessionStatus = sessionStatus;
        }

        // Getters
        public String getRoomId() { return roomId; }
        public int getParticipantCount() { return participantCount; }
        public boolean isActive() { return isActive; }
        public long getSessionStartTime() { return sessionStartTime; }
        public String getSessionStatus() { return sessionStatus; }
    }
}
