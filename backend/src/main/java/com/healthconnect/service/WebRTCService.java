package com.healthconnect.service;

import com.healthconnect.dto.WebRTCSignalRequest;
import com.healthconnect.dto.CallRecordingRequest;
import com.healthconnect.dto.CallQualityMetrics;
import com.healthconnect.controller.WebRTCController.RoomStatusResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Base64;

@Service
@Slf4j
public class WebRTCService {

    private SimpMessagingTemplate messagingTemplate;

    @Autowired(required = false)
    public void setMessagingTemplate(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    // In-memory storage for active sessions (in production, use Redis or database)
    private final Map<String, WebRTCSession> activeSessions = new ConcurrentHashMap<>();
    private final Map<String, List<WebRTCPeer>> roomPeers = new ConcurrentHashMap<>();
    
    public String createSession(String roomId) {
        String sessionId = UUID.randomUUID().toString();
        
        WebRTCSession session = WebRTCSession.builder()
                .sessionId(sessionId)
                .roomId(roomId)
                .status(SessionStatus.CREATED)
                .createdAt(System.currentTimeMillis())
                .build();
        
        activeSessions.put(sessionId, session);
        roomPeers.put(roomId, new CopyOnWriteArrayList<>());
        
        log.info("Created WebRTC session: {} for room: {}", sessionId, roomId);
        return sessionId;
    }
    
    public void initializeUserSession(String roomId, Long userId, String userRole) {
        WebRTCPeer peer = WebRTCPeer.builder()
                .userId(userId)
                .userRole(userRole)
                .peerId(UUID.randomUUID().toString())
                .joinedAt(System.currentTimeMillis())
                .build();
        
        List<WebRTCPeer> peers = roomPeers.get(roomId);
        if (peers != null) {
            peers.add(peer);
            
            // Notify other peers about new user
            notifyPeersUserJoined(roomId, peer);
            
            // Send existing peers to new user
            sendExistingPeersToUser(roomId, peer);
        }
        
        log.info("User {} joined room: {} as {}", userId, roomId, userRole);
    }
    
    public void handleWebRTCSignal(String roomId, Long userId, WebRTCSignalRequest signal) {
        List<WebRTCPeer> peers = roomPeers.get(roomId);
        if (peers == null) {
            log.warn("Room not found: {}", roomId);
            return;
        }
        
        WebRTCPeer sender = peers.stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .orElse(null);
        
        if (sender == null) {
            log.warn("Sender not found in room: {}", roomId);
            return;
        }
        
        switch (signal.getType()) {
            case "OFFER":
                handleOffer(roomId, sender, signal);
                break;
            case "ANSWER":
                handleAnswer(roomId, sender, signal);
                break;
            case "ICE_CANDIDATE":
                handleIceCandidate(roomId, sender, signal);
                break;
            case "SCREEN_SHARE_START":
                handleScreenShareStart(roomId, sender);
                break;
            case "SCREEN_SHARE_STOP":
                handleScreenShareStop(roomId, sender);
                break;
        }
    }
    
    private void handleOffer(String roomId, WebRTCPeer sender, WebRTCSignalRequest signal) {
        // Forward offer to target peer or broadcast to room if no specific target
        String targetPeerId = signal.getTargetPeerId();

        WebRTCMessage message = WebRTCMessage.builder()
                .type(MessageType.OFFER)
                .fromPeerId(sender.getPeerId())
                .toPeerId(targetPeerId)
                .data(signal.getData())
                .build();

        if (targetPeerId != null && !targetPeerId.isEmpty()) {
            WebRTCPeer targetPeer = findPeerById(roomId, targetPeerId);
            if (targetPeer != null) {
                sendMessageToPeer(roomId, targetPeer.getUserId(), message);
                log.debug("Forwarded offer from {} to {}", sender.getPeerId(), targetPeerId);
            }
        } else {
            // Broadcast to room if no specific target
            broadcastToRoom(roomId, message);
            log.debug("Broadcasted offer from {} to room {}", sender.getPeerId(), roomId);
        }
    }
    
    private void handleAnswer(String roomId, WebRTCPeer sender, WebRTCSignalRequest signal) {
        // Forward answer to target peer or broadcast to room if no specific target
        String targetPeerId = signal.getTargetPeerId();

        WebRTCMessage message = WebRTCMessage.builder()
                .type(MessageType.ANSWER)
                .fromPeerId(sender.getPeerId())
                .toPeerId(targetPeerId)
                .data(signal.getData())
                .build();

        if (targetPeerId != null && !targetPeerId.isEmpty()) {
            WebRTCPeer targetPeer = findPeerById(roomId, targetPeerId);
            if (targetPeer != null) {
                sendMessageToPeer(roomId, targetPeer.getUserId(), message);
                log.debug("Forwarded answer from {} to {}", sender.getPeerId(), targetPeerId);
            }
        } else {
            // Broadcast to room if no specific target
            broadcastToRoom(roomId, message);
            log.debug("Broadcasted answer from {} to room {}", sender.getPeerId(), roomId);
        }
    }
    
    private void handleIceCandidate(String roomId, WebRTCPeer sender, WebRTCSignalRequest signal) {
        // Forward ICE candidate to target peer or broadcast to room if no specific target
        String targetPeerId = signal.getTargetPeerId();

        WebRTCMessage message = WebRTCMessage.builder()
                .type(MessageType.ICE_CANDIDATE)
                .fromPeerId(sender.getPeerId())
                .toPeerId(targetPeerId)
                .data(signal.getData())
                .build();

        if (targetPeerId != null && !targetPeerId.isEmpty()) {
            WebRTCPeer targetPeer = findPeerById(roomId, targetPeerId);
            if (targetPeer != null) {
                sendMessageToPeer(roomId, targetPeer.getUserId(), message);
                log.debug("Forwarded ICE candidate from {} to {}", sender.getPeerId(), targetPeerId);
            }
        } else {
            // Broadcast to room if no specific target
            broadcastToRoom(roomId, message);
            log.debug("Broadcasted ICE candidate from {} to room {}", sender.getPeerId(), roomId);
        }
    }
    
    private void handleScreenShareStart(String roomId, WebRTCPeer sender) {
        sender.setScreenSharing(true);
        
        // Notify all other peers
        List<WebRTCPeer> peers = roomPeers.get(roomId);
        if (peers != null) {
            peers.stream()
                    .filter(p -> !p.getUserId().equals(sender.getUserId()))
                    .forEach(peer -> {
                        WebRTCMessage message = WebRTCMessage.builder()
                                .type(MessageType.SCREEN_SHARE_START)
                                .fromPeerId(sender.getPeerId())
                                .build();
                        
                        sendMessageToPeer(roomId, peer.getUserId(), message);
                    });
        }
    }
    
    private void handleScreenShareStop(String roomId, WebRTCPeer sender) {
        sender.setScreenSharing(false);
        
        // Notify all other peers
        List<WebRTCPeer> peers = roomPeers.get(roomId);
        if (peers != null) {
            peers.stream()
                    .filter(p -> !p.getUserId().equals(sender.getUserId()))
                    .forEach(peer -> {
                        WebRTCMessage message = WebRTCMessage.builder()
                                .type(MessageType.SCREEN_SHARE_STOP)
                                .fromPeerId(sender.getPeerId())
                                .build();
                        
                        sendMessageToPeer(roomId, peer.getUserId(), message);
                    });
        }
    }
    
    public void removeUserFromRoom(String roomId, Long userId) {
        List<WebRTCPeer> peers = roomPeers.get(roomId);
        if (peers != null) {
            WebRTCPeer removedPeer = peers.stream()
                    .filter(p -> p.getUserId().equals(userId))
                    .findFirst()
                    .orElse(null);
            
            if (removedPeer != null) {
                peers.remove(removedPeer);
                
                // Notify other peers
                notifyPeersUserLeft(roomId, removedPeer);
            }
        }
        
        log.info("User {} left room: {}", userId, roomId);
    }
    
    public void endSession(String roomId) {
        // Remove all peers from room
        List<WebRTCPeer> peers = roomPeers.remove(roomId);
        if (peers != null) {
            // Notify all peers that session is ending
            peers.forEach(peer -> {
                WebRTCMessage message = WebRTCMessage.builder()
                        .type(MessageType.SESSION_END)
                        .build();
                
                sendMessageToPeer(roomId, peer.getUserId(), message);
            });
        }
        
        // Remove session
        activeSessions.values().removeIf(session -> session.getRoomId().equals(roomId));
        
        log.info("Ended WebRTC session for room: {}", roomId);
    }
    
    private void notifyPeersUserJoined(String roomId, WebRTCPeer newPeer) {
        List<WebRTCPeer> peers = roomPeers.get(roomId);
        if (peers != null) {
            WebRTCMessage message = WebRTCMessage.builder()
                    .type(MessageType.USER_JOINED)
                    .fromPeerId(newPeer.getPeerId())
                    .data(Map.of(
                        "userRole", newPeer.getUserRole(),
                        "userId", newPeer.getUserId()
                    ))
                    .build();

            // Broadcast to entire room
            broadcastToRoom(roomId, message);

            log.info("Notified room {} that user {} joined", roomId, newPeer.getUserId());
        }
    }
    
    private void notifyPeersUserLeft(String roomId, WebRTCPeer leftPeer) {
        List<WebRTCPeer> peers = roomPeers.get(roomId);
        if (peers != null) {
            peers.forEach(peer -> {
                WebRTCMessage message = WebRTCMessage.builder()
                        .type(MessageType.USER_LEFT)
                        .fromPeerId(leftPeer.getPeerId())
                        .build();
                
                sendMessageToPeer(roomId, peer.getUserId(), message);
            });
        }
    }
    
    private void sendExistingPeersToUser(String roomId, WebRTCPeer newPeer) {
        List<WebRTCPeer> peers = roomPeers.get(roomId);
        if (peers != null) {
            peers.stream()
                    .filter(p -> !p.getUserId().equals(newPeer.getUserId()))
                    .forEach(peer -> {
                        WebRTCMessage message = WebRTCMessage.builder()
                                .type(MessageType.EXISTING_PEER)
                                .fromPeerId(peer.getPeerId())
                                .data(Map.of("userRole", peer.getUserRole(), "screenSharing", peer.isScreenSharing()))
                                .build();
                        
                        sendMessageToPeer(roomId, newPeer.getUserId(), message);
                    });
        }
    }
    
    private WebRTCPeer findPeerById(String roomId, String peerId) {
        List<WebRTCPeer> peers = roomPeers.get(roomId);
        if (peers != null) {
            return peers.stream()
                    .filter(p -> p.getPeerId().equals(peerId))
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }
    
    private void sendMessageToPeer(String roomId, Long userId, WebRTCMessage message) {
        if (messagingTemplate != null) {
            // Send to both user-specific and room-wide topics
            String userDestination = "/topic/webrtc/" + roomId + "/" + userId;
            String roomDestination = "/topic/webrtc/" + roomId;

            log.debug("Sending WebRTC message to user {} in room {}: {}", userId, roomId, message.getType());
            messagingTemplate.convertAndSend(userDestination, message);
            messagingTemplate.convertAndSend(roomDestination, message);
        } else {
            log.debug("WebSocket not enabled, skipping WebRTC message for room: {}, user: {}", roomId, userId);
        }
    }

    private void broadcastToRoom(String roomId, WebRTCMessage message) {
        if (messagingTemplate != null) {
            String destination = "/topic/webrtc/" + roomId;
            log.debug("Broadcasting WebRTC message to room {}: {}", roomId, message.getType());
            messagingTemplate.convertAndSend(destination, message);
        }
    }

    // New methods for recording and quality metrics
    public String saveRecording(CallRecordingRequest request, Long userId) {
        try {
            // Decode base64 recording data
            byte[] recordingBytes = Base64.getDecoder().decode(request.getRecordingData());

            // Generate unique filename
            String fileName = "recording_" + request.getConsultationId() + "_" +
                            System.currentTimeMillis() + "." + getFileExtension(request.getMimeType());

            // In production, save to cloud storage (AWS S3, Google Cloud Storage, etc.)
            // For now, we'll simulate saving and return a URL
            String recordingUrl = "/api/recordings/" + fileName;

            log.info("Recording saved for consultation: {} by user: {}, size: {} bytes",
                    request.getConsultationId(), userId, recordingBytes.length);

            return recordingUrl;

        } catch (Exception e) {
            log.error("Failed to save recording: {}", e.getMessage());
            throw new RuntimeException("Failed to save recording");
        }
    }

    public void saveQualityMetrics(CallQualityMetrics metrics, Long userId) {
        try {
            // In production, save to database
            log.info("Quality metrics saved for consultation: {} by user: {}, " +
                    "audio: {}, video: {}, latency: {}ms",
                    metrics.getConsultationId(), userId,
                    metrics.getAudioQuality(), metrics.getVideoQuality(), metrics.getLatencyMs());

        } catch (Exception e) {
            log.error("Failed to save quality metrics: {}", e.getMessage());
            throw new RuntimeException("Failed to save quality metrics");
        }
    }

    public RoomStatusResponse getRoomStatus(String roomId, Long userId) {
        List<WebRTCPeer> peers = roomPeers.get(roomId);
        WebRTCSession session = activeSessions.values().stream()
                .filter(s -> s.getRoomId().equals(roomId))
                .findFirst()
                .orElse(null);

        int participantCount = peers != null ? peers.size() : 0;
        boolean isActive = session != null && session.getStatus() == SessionStatus.ACTIVE;
        long sessionStartTime = session != null ? session.getCreatedAt() : 0;
        String sessionStatus = session != null ? session.getStatus().name() : "NOT_FOUND";

        return new RoomStatusResponse(roomId, participantCount, isActive, sessionStartTime, sessionStatus);
    }

    private String getFileExtension(String mimeType) {
        switch (mimeType) {
            case "video/webm": return "webm";
            case "video/mp4": return "mp4";
            case "audio/webm": return "webm";
            case "audio/wav": return "wav";
            default: return "webm";
        }
    }

    // Data classes
    public static class WebRTCSession {
        private String sessionId;
        private String roomId;
        private SessionStatus status;
        private long createdAt;
        
        public static WebRTCSessionBuilder builder() {
            return new WebRTCSessionBuilder();
        }
        
        // Getters and setters
        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        public String getRoomId() { return roomId; }
        public void setRoomId(String roomId) { this.roomId = roomId; }
        public SessionStatus getStatus() { return status; }
        public void setStatus(SessionStatus status) { this.status = status; }
        public long getCreatedAt() { return createdAt; }
        public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
        
        public static class WebRTCSessionBuilder {
            private String sessionId;
            private String roomId;
            private SessionStatus status;
            private long createdAt;
            
            public WebRTCSessionBuilder sessionId(String sessionId) { this.sessionId = sessionId; return this; }
            public WebRTCSessionBuilder roomId(String roomId) { this.roomId = roomId; return this; }
            public WebRTCSessionBuilder status(SessionStatus status) { this.status = status; return this; }
            public WebRTCSessionBuilder createdAt(long createdAt) { this.createdAt = createdAt; return this; }
            
            public WebRTCSession build() {
                WebRTCSession session = new WebRTCSession();
                session.sessionId = this.sessionId;
                session.roomId = this.roomId;
                session.status = this.status;
                session.createdAt = this.createdAt;
                return session;
            }
        }
    }
    
    public static class WebRTCPeer {
        private Long userId;
        private String userRole;
        private String peerId;
        private long joinedAt;
        private boolean screenSharing = false;
        
        public static WebRTCPeerBuilder builder() {
            return new WebRTCPeerBuilder();
        }
        
        // Getters and setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getUserRole() { return userRole; }
        public void setUserRole(String userRole) { this.userRole = userRole; }
        public String getPeerId() { return peerId; }
        public void setPeerId(String peerId) { this.peerId = peerId; }
        public long getJoinedAt() { return joinedAt; }
        public void setJoinedAt(long joinedAt) { this.joinedAt = joinedAt; }
        public boolean isScreenSharing() { return screenSharing; }
        public void setScreenSharing(boolean screenSharing) { this.screenSharing = screenSharing; }
        
        public static class WebRTCPeerBuilder {
            private Long userId;
            private String userRole;
            private String peerId;
            private long joinedAt;
            
            public WebRTCPeerBuilder userId(Long userId) { this.userId = userId; return this; }
            public WebRTCPeerBuilder userRole(String userRole) { this.userRole = userRole; return this; }
            public WebRTCPeerBuilder peerId(String peerId) { this.peerId = peerId; return this; }
            public WebRTCPeerBuilder joinedAt(long joinedAt) { this.joinedAt = joinedAt; return this; }
            
            public WebRTCPeer build() {
                WebRTCPeer peer = new WebRTCPeer();
                peer.userId = this.userId;
                peer.userRole = this.userRole;
                peer.peerId = this.peerId;
                peer.joinedAt = this.joinedAt;
                return peer;
            }
        }
    }
    
    public static class WebRTCSignal {
        private SignalType type;
        private String targetPeerId;
        private Object data;
        
        // Getters and setters
        public SignalType getType() { return type; }
        public void setType(SignalType type) { this.type = type; }
        public String getTargetPeerId() { return targetPeerId; }
        public void setTargetPeerId(String targetPeerId) { this.targetPeerId = targetPeerId; }
        public Object getData() { return data; }
        public void setData(Object data) { this.data = data; }
    }
    
    public static class WebRTCMessage {
        private MessageType type;
        private String fromPeerId;
        private String toPeerId;
        private Object data;
        
        public static WebRTCMessageBuilder builder() {
            return new WebRTCMessageBuilder();
        }
        
        // Getters and setters
        public MessageType getType() { return type; }
        public void setType(MessageType type) { this.type = type; }
        public String getFromPeerId() { return fromPeerId; }
        public void setFromPeerId(String fromPeerId) { this.fromPeerId = fromPeerId; }
        public String getToPeerId() { return toPeerId; }
        public void setToPeerId(String toPeerId) { this.toPeerId = toPeerId; }
        public Object getData() { return data; }
        public void setData(Object data) { this.data = data; }
        
        public static class WebRTCMessageBuilder {
            private MessageType type;
            private String fromPeerId;
            private String toPeerId;
            private Object data;
            
            public WebRTCMessageBuilder type(MessageType type) { this.type = type; return this; }
            public WebRTCMessageBuilder fromPeerId(String fromPeerId) { this.fromPeerId = fromPeerId; return this; }
            public WebRTCMessageBuilder toPeerId(String toPeerId) { this.toPeerId = toPeerId; return this; }
            public WebRTCMessageBuilder data(Object data) { this.data = data; return this; }
            
            public WebRTCMessage build() {
                WebRTCMessage message = new WebRTCMessage();
                message.type = this.type;
                message.fromPeerId = this.fromPeerId;
                message.toPeerId = this.toPeerId;
                message.data = this.data;
                return message;
            }
        }
    }
    
    public enum SessionStatus {
        CREATED, ACTIVE, ENDED
    }
    
    public enum SignalType {
        OFFER, ANSWER, ICE_CANDIDATE, SCREEN_SHARE_START, SCREEN_SHARE_STOP
    }
    
    public enum MessageType {
        OFFER, ANSWER, ICE_CANDIDATE, USER_JOINED, USER_LEFT, EXISTING_PEER, 
        SCREEN_SHARE_START, SCREEN_SHARE_STOP, SESSION_END
    }
}
