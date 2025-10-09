package com.healthconnect.repository;

import com.healthconnect.entity.Chat;
import com.healthconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {
    
    @Query("SELECT c FROM Chat c WHERE (c.patient = :user OR c.doctor = :user) ORDER BY c.updatedAt DESC")
    List<Chat> findByParticipant(@Param("user") User user);
    
    @Query("SELECT c FROM Chat c WHERE (c.patient = :patient AND c.doctor = :doctor) OR (c.patient = :doctor AND c.doctor = :patient)")
    Optional<Chat> findByParticipants(@Param("patient") User patient, @Param("doctor") User doctor);
    
    @Query("SELECT c FROM Chat c WHERE c.patient.id = :patientId AND c.doctor.id = :doctorId")
    Optional<Chat> findByPatientIdAndDoctorId(@Param("patientId") Long patientId, @Param("doctorId") Long doctorId);

    @Query("SELECT c FROM Chat c WHERE (c.patient = :patient AND c.doctor = :doctor) AND c.relatedAppointment.id = :appointmentId")
    Optional<Chat> findByParticipantsAndAppointment(@Param("patient") User patient, @Param("doctor") User doctor, @Param("appointmentId") Long appointmentId);

    @Query("SELECT c FROM Chat c WHERE c.patient = :patient AND c.doctor = :doctor AND c.relatedAppointment IS NULL")
    Optional<Chat> findByParticipantsWithoutAppointment(@Param("patient") User patient, @Param("doctor") User doctor);

    @Query("SELECT c FROM Chat c WHERE (c.patient = :user OR c.doctor = :user) AND c.relatedAppointment.id = :appointmentId")
    List<Chat> findByParticipantAndAppointment(@Param("user") User user, @Param("appointmentId") Long appointmentId);
}
