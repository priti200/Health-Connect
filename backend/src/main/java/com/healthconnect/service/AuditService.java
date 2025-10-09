package com.healthconnect.service;

import com.healthconnect.entity.AuditLog;
import com.healthconnect.entity.User;
import com.healthconnect.entity.UserRole;
import com.healthconnect.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {
    
    private final AuditLogRepository auditLogRepository;
    
    @Async
    public void logVideoConsultationAccess(User user, String consultationId, String action) {
        logAudit(user, "VIDEO_CONSULTATION_ACCESS", "VIDEO_CONSULTATION", consultationId, 
                action, AuditLog.RiskLevel.MEDIUM, "HIPAA_SENSITIVE");
    }
    
    @Async
    public void logVideoConsultationStart(User user, String consultationId) {
        logAudit(user, "VIDEO_CONSULTATION_START", "VIDEO_CONSULTATION", consultationId, 
                "Started video consultation session", AuditLog.RiskLevel.HIGH, "HIPAA_CRITICAL");
    }
    
    @Async
    public void logVideoConsultationEnd(User user, String consultationId, String duration) {
        logAudit(user, "VIDEO_CONSULTATION_END", "VIDEO_CONSULTATION", consultationId, 
                "Ended video consultation session. Duration: " + duration, AuditLog.RiskLevel.HIGH, "HIPAA_CRITICAL");
    }
    
    @Async
    public void logPatientDataAccess(User user, String patientId, String dataType) {
        logAudit(user, "PATIENT_DATA_ACCESS", "PATIENT_DATA", patientId, 
                "Accessed patient " + dataType, AuditLog.RiskLevel.HIGH, "HIPAA_PHI");
    }
    
    @Async
    public void logAuthenticationAttempt(String email, boolean success, String ipAddress) {
        AuditLog.AuditLogBuilder builder = AuditLog.builder()
                .userEmail(email)
                .action(success ? "LOGIN_SUCCESS" : "LOGIN_FAILURE")
                .resourceType("AUTHENTICATION")
                .ipAddress(ipAddress)
                .status(success ? AuditLog.AuditStatus.SUCCESS : AuditLog.AuditStatus.FAILURE)
                .riskLevel(success ? AuditLog.RiskLevel.LOW : AuditLog.RiskLevel.MEDIUM)
                .complianceFlags("HIPAA_AUTH")
                .sessionId(generateSessionId());
        
        HttpServletRequest request = getCurrentRequest();
        if (request != null) {
            builder.userAgent(request.getHeader("User-Agent"));
        }
        
        auditLogRepository.save(builder.build());
        
        if (!success) {
            log.warn("Failed authentication attempt for email: {} from IP: {}", email, ipAddress);
        }
    }
    
    @Async
    public void logSecurityViolation(User user, String violation, String details) {
        logAudit(user, "SECURITY_VIOLATION", "SECURITY", null, 
                violation + ": " + details, AuditLog.RiskLevel.CRITICAL, "HIPAA_SECURITY");
    }
    
    @Async
    public void logDataExport(User user, String dataType, String exportDetails) {
        logAudit(user, "DATA_EXPORT", "DATA_EXPORT", null, 
                "Exported " + dataType + ": " + exportDetails, AuditLog.RiskLevel.HIGH, "HIPAA_EXPORT");
    }
    
    private void logAudit(User user, String action, String resourceType, String resourceId, 
                         String details, AuditLog.RiskLevel riskLevel, String complianceFlags) {
        
        HttpServletRequest request = getCurrentRequest();
        String ipAddress = getClientIpAddress(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        
        AuditLog auditLog = AuditLog.builder()
                .userId(user.getId())
                .userEmail(user.getEmail())
                .userRole(user.getRole())
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .sessionId(generateSessionId())
                .details(details)
                .status(AuditLog.AuditStatus.SUCCESS)
                .riskLevel(riskLevel)
                .complianceFlags(complianceFlags)
                .build();
        
        auditLogRepository.save(auditLog);
        
        // Log high-risk activities
        if (riskLevel == AuditLog.RiskLevel.HIGH || riskLevel == AuditLog.RiskLevel.CRITICAL) {
            log.warn("High-risk activity logged: {} by user {} ({})", action, user.getEmail(), user.getRole());
        }
    }
    
    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            return attributes.getRequest();
        } catch (Exception e) {
            return null;
        }
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) return "unknown";
        
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    private String generateSessionId() {
        return UUID.randomUUID().toString();
    }
    
    // Query methods for compliance reporting
    public Page<AuditLog> getUserAuditLogs(Long userId, Pageable pageable) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }
    
    public Page<AuditLog> getAuditLogsByDateRange(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable) {
        return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(startTime, endTime, pageable);
    }
    
    public List<AuditLog> getVideoConsultationAudits(String consultationId) {
        return auditLogRepository.findVideoConsultationAuditsById(consultationId);
    }
    
    public List<AuditLog> getHighRiskActivities(LocalDateTime since) {
        return auditLogRepository.findHighRiskActivitiesSince(since);
    }
    
    public Long getUserActivityCount(Long userId, LocalDateTime since) {
        return auditLogRepository.countUserActivitySince(userId, since);
    }
}
