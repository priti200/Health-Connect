package com.healthconnect.repository;

import com.healthconnect.entity.Appointment;
import com.healthconnect.entity.AppointmentStatus;
import com.healthconnect.entity.AppointmentType;
import com.healthconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    // Find appointments by doctor
    List<Appointment> findByDoctorOrderByDateAscStartTimeAsc(User doctor);
    
    // Find appointments by patient
    List<Appointment> findByPatientOrderByDateAscStartTimeAsc(User patient);
    
    // Find appointments by doctor and date
    List<Appointment> findByDoctorAndDateOrderByStartTimeAsc(User doctor, LocalDate date);
    
    // Find appointments by patient and date
    List<Appointment> findByPatientAndDateOrderByStartTimeAsc(User patient, LocalDate date);
    
    // Find appointments by status
    List<Appointment> findByStatusOrderByDateAscStartTimeAsc(AppointmentStatus status);
    
    // Find appointments by type
    List<Appointment> findByTypeOrderByDateAscStartTimeAsc(AppointmentType type);
    
    // Find appointments by doctor and status
    List<Appointment> findByDoctorAndStatusOrderByDateAscStartTimeAsc(User doctor, AppointmentStatus status);
    
    // Find appointments by patient and status
    List<Appointment> findByPatientAndStatusOrderByDateAscStartTimeAsc(User patient, AppointmentStatus status);
    
    // Find appointments by date range
    @Query("SELECT a FROM Appointment a WHERE a.date BETWEEN :startDate AND :endDate ORDER BY a.date ASC, a.startTime ASC")
    List<Appointment> findByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Find appointments by doctor and date range
    @Query("SELECT a FROM Appointment a WHERE a.doctor = :doctor AND a.date BETWEEN :startDate AND :endDate ORDER BY a.date ASC, a.startTime ASC")
    List<Appointment> findByDoctorAndDateBetween(@Param("doctor") User doctor, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Find appointments by patient and date range
    @Query("SELECT a FROM Appointment a WHERE a.patient = :patient AND a.date BETWEEN :startDate AND :endDate ORDER BY a.date ASC, a.startTime ASC")
    List<Appointment> findByPatientAndDateBetween(@Param("patient") User patient, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Check for conflicting appointments (same doctor, date, and overlapping time)
    @Query("SELECT a FROM Appointment a WHERE a.doctor = :doctor AND a.date = :date AND " +
           "((a.startTime <= :startTime AND a.endTime > :startTime) OR " +
           "(a.startTime < :endTime AND a.endTime >= :endTime) OR " +
           "(a.startTime >= :startTime AND a.endTime <= :endTime)) AND " +
           "a.status NOT IN ('CANCELLED', 'NO_SHOW')")
    List<Appointment> findConflictingAppointments(@Param("doctor") User doctor, 
                                                 @Param("date") LocalDate date,
                                                 @Param("startTime") LocalTime startTime, 
                                                 @Param("endTime") LocalTime endTime);
    
    // Find today's appointments for a doctor
    @Query("SELECT a FROM Appointment a WHERE a.doctor = :doctor AND a.date = :today ORDER BY a.startTime ASC")
    List<Appointment> findTodayAppointmentsByDoctor(@Param("doctor") User doctor, @Param("today") LocalDate today);
    
    // Find today's appointments for a patient
    @Query("SELECT a FROM Appointment a WHERE a.patient = :patient AND a.date = :today ORDER BY a.startTime ASC")
    List<Appointment> findTodayAppointmentsByPatient(@Param("patient") User patient, @Param("today") LocalDate today);
    
    // Count appointments by doctor and status
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor = :doctor AND a.status = :status")
    Long countByDoctorAndStatus(@Param("doctor") User doctor, @Param("status") AppointmentStatus status);
    
    // Count appointments by patient and status
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.patient = :patient AND a.status = :status")
    Long countByPatientAndStatus(@Param("patient") User patient, @Param("status") AppointmentStatus status);
}
