package com.healthconnect.repository;

import com.healthconnect.entity.User;
import com.healthconnect.entity.VideoConsultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VideoConsultationRepository extends JpaRepository<VideoConsultation, Long> {
    
    Optional<VideoConsultation> findByRoomId(String roomId);

    @Query("SELECT vc FROM VideoConsultation vc WHERE vc.appointment.id = :appointmentId")
    Optional<VideoConsultation> findByAppointmentId(@Param("appointmentId") Long appointmentId);

    List<VideoConsultation> findByDoctorOrderByScheduledStartTimeDesc(User doctor);
    
    List<VideoConsultation> findByPatientOrderByScheduledStartTimeDesc(User patient);
    
    List<VideoConsultation> findByDoctorAndStatusOrderByScheduledStartTimeDesc(User doctor, VideoConsultation.ConsultationStatus status);
    
    List<VideoConsultation> findByPatientAndStatusOrderByScheduledStartTimeDesc(User patient, VideoConsultation.ConsultationStatus status);
    
    @Query("SELECT vc FROM VideoConsultation vc WHERE vc.doctor = :doctor AND vc.scheduledStartTime >= :now AND vc.status IN ('SCHEDULED', 'WAITING_FOR_PATIENT', 'WAITING_FOR_DOCTOR') ORDER BY vc.scheduledStartTime ASC")
    List<VideoConsultation> findUpcomingConsultationsForDoctor(@Param("doctor") User doctor, @Param("now") LocalDateTime now);
    
    @Query("SELECT vc FROM VideoConsultation vc WHERE vc.patient = :patient AND vc.scheduledStartTime >= :now AND vc.status IN ('SCHEDULED', 'WAITING_FOR_PATIENT', 'WAITING_FOR_DOCTOR') ORDER BY vc.scheduledStartTime ASC")
    List<VideoConsultation> findUpcomingConsultationsForPatient(@Param("patient") User patient, @Param("now") LocalDateTime now);
    
    @Query("SELECT vc FROM VideoConsultation vc WHERE vc.status = 'IN_PROGRESS' AND vc.actualStartTime < :cutoff")
    List<VideoConsultation> findLongRunningConsultations(@Param("cutoff") LocalDateTime cutoff);
    
    @Query("SELECT vc FROM VideoConsultation vc WHERE vc.status IN ('WAITING_FOR_DOCTOR', 'WAITING_FOR_PATIENT') AND vc.scheduledStartTime < :cutoff")
    List<VideoConsultation> findAbandonedConsultations(@Param("cutoff") LocalDateTime cutoff);
    
    Long countByDoctorAndStatus(User doctor, VideoConsultation.ConsultationStatus status);
    
    Long countByPatientAndStatus(User patient, VideoConsultation.ConsultationStatus status);
    
    @Query("SELECT COUNT(vc) FROM VideoConsultation vc WHERE vc.doctor = :doctor AND vc.actualStartTime >= :since")
    Long countCompletedConsultationsForDoctor(@Param("doctor") User doctor, @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(vc) FROM VideoConsultation vc WHERE vc.patient = :patient AND vc.actualStartTime >= :since")
    Long countCompletedConsultationsForPatient(@Param("patient") User patient, @Param("since") LocalDateTime since);
}
