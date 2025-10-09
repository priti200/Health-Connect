package com.healthconnect.repository;

import com.healthconnect.entity.SymptomQuestionnaire;
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
public interface SymptomQuestionnaireRepository extends JpaRepository<SymptomQuestionnaire, Long> {
    
    List<SymptomQuestionnaire> findByUserOrderByCreatedAtDesc(User user);
    
    Page<SymptomQuestionnaire> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    List<SymptomQuestionnaire> findByUserAndStatusOrderByCreatedAtDesc(User user, SymptomQuestionnaire.QuestionnaireStatus status);
    
    List<SymptomQuestionnaire> findByUserAndTypeOrderByCreatedAtDesc(User user, SymptomQuestionnaire.QuestionnaireType type);
    
    List<SymptomQuestionnaire> findByUserAndRiskLevelOrderByCreatedAtDesc(User user, SymptomQuestionnaire.RiskLevel riskLevel);
    
    @Query("SELECT sq FROM SymptomQuestionnaire sq WHERE sq.user = :user AND sq.createdAt >= :since ORDER BY sq.createdAt DESC")
    List<SymptomQuestionnaire> findRecentQuestionnaires(@Param("user") User user, @Param("since") LocalDateTime since);
    
    @Query("SELECT sq FROM SymptomQuestionnaire sq WHERE sq.riskLevel IN ('HIGH', 'VERY_HIGH', 'EMERGENCY') AND sq.createdAt >= :since ORDER BY sq.createdAt DESC")
    List<SymptomQuestionnaire> findHighRiskQuestionnaires(@Param("since") LocalDateTime since);
    
    @Query("SELECT sq FROM SymptomQuestionnaire sq WHERE sq.status = 'IN_PROGRESS' AND sq.updatedAt < :cutoff")
    List<SymptomQuestionnaire> findAbandonedQuestionnaires(@Param("cutoff") LocalDateTime cutoff);
    
    Long countByUser(User user);
    
    Long countByUserAndStatus(User user, SymptomQuestionnaire.QuestionnaireStatus status);
    
    @Query("SELECT COUNT(sq) FROM SymptomQuestionnaire sq WHERE sq.user = :user AND sq.createdAt >= :since")
    Long countRecentQuestionnaires(@Param("user") User user, @Param("since") LocalDateTime since);
    
    @Query("SELECT sq.type, COUNT(sq) FROM SymptomQuestionnaire sq WHERE sq.user = :user GROUP BY sq.type")
    List<Object[]> getQuestionnaireTypeStatistics(@Param("user") User user);
    
    @Query("SELECT sq.riskLevel, COUNT(sq) FROM SymptomQuestionnaire sq WHERE sq.user = :user AND sq.status = 'COMPLETED' GROUP BY sq.riskLevel")
    List<Object[]> getRiskLevelStatistics(@Param("user") User user);
}
