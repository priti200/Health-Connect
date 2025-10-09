package com.healthconnect.repository;

import com.healthconnect.entity.SymptomAnalysis;
import com.healthconnect.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SymptomAnalysisRepository extends JpaRepository<SymptomAnalysis, Long> {
    
    List<SymptomAnalysis> findByUserOrderByCreatedAtDesc(User user);
    
    Page<SymptomAnalysis> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    List<SymptomAnalysis> findByUserAndUrgencyLevelOrderByCreatedAtDesc(User user, SymptomAnalysis.UrgencyLevel urgencyLevel);
    
    @Query("SELECT sa FROM SymptomAnalysis sa WHERE sa.user = :user AND sa.createdAt >= :since ORDER BY sa.createdAt DESC")
    List<SymptomAnalysis> findRecentAnalyses(@Param("user") User user, @Param("since") LocalDateTime since);
    
    @Query("SELECT sa FROM SymptomAnalysis sa WHERE sa.isSharedWithDoctor = true AND sa.sharedWithDoctorId = :doctorId ORDER BY sa.sharedAt DESC")
    List<SymptomAnalysis> findSharedAnalysesForDoctor(@Param("doctorId") Long doctorId);
    
    @Query("SELECT sa FROM SymptomAnalysis sa WHERE sa.urgencyLevel IN ('HIGH', 'EMERGENCY') AND sa.createdAt >= :since ORDER BY sa.createdAt DESC")
    List<SymptomAnalysis> findHighUrgencyAnalyses(@Param("since") LocalDateTime since);
    
    Long countByUser(User user);
    
    @Query("SELECT COUNT(sa) FROM SymptomAnalysis sa WHERE sa.user = :user AND sa.createdAt >= :since")
    Long countRecentAnalyses(@Param("user") User user, @Param("since") LocalDateTime since);
}
