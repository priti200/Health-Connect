package com.healthconnect.repository;

import com.healthconnect.entity.AuditLog;
import com.healthconnect.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    Page<AuditLog> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);
    
    Page<AuditLog> findByUserRoleOrderByTimestampDesc(UserRole userRole, Pageable pageable);
    
    Page<AuditLog> findByActionContainingIgnoreCaseOrderByTimestampDesc(String action, Pageable pageable);
    
    Page<AuditLog> findByResourceTypeOrderByTimestampDesc(String resourceType, Pageable pageable);
    
    Page<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);
    
    Page<AuditLog> findByRiskLevelOrderByTimestampDesc(AuditLog.RiskLevel riskLevel, Pageable pageable);
    
    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId AND a.resourceType = 'VIDEO_CONSULTATION' ORDER BY a.timestamp DESC")
    List<AuditLog> findVideoConsultationAuditsByUser(@Param("userId") Long userId);
    
    @Query("SELECT a FROM AuditLog a WHERE a.resourceId = :resourceId AND a.resourceType = 'VIDEO_CONSULTATION' ORDER BY a.timestamp DESC")
    List<AuditLog> findVideoConsultationAuditsById(@Param("resourceId") String resourceId);
    
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.userId = :userId AND a.timestamp >= :since")
    Long countUserActivitySince(@Param("userId") Long userId, @Param("since") LocalDateTime since);
    
    @Query("SELECT a FROM AuditLog a WHERE a.riskLevel IN ('HIGH', 'CRITICAL') AND a.timestamp >= :since ORDER BY a.timestamp DESC")
    List<AuditLog> findHighRiskActivitiesSince(@Param("since") LocalDateTime since);
}
