package com.healthconnect.repository;

import com.healthconnect.entity.DigitalPrescription;
import com.healthconnect.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DigitalPrescriptionRepository extends JpaRepository<DigitalPrescription, Long> {
    
    Optional<DigitalPrescription> findByPrescriptionNumber(String prescriptionNumber);
    
    List<DigitalPrescription> findByDoctorOrderByIssueDateDesc(User doctor);
    
    List<DigitalPrescription> findByPatientOrderByIssueDateDesc(User patient);
    
    Page<DigitalPrescription> findByDoctorOrderByIssueDateDesc(User doctor, Pageable pageable);
    
    Page<DigitalPrescription> findByPatientOrderByIssueDateDesc(User patient, Pageable pageable);
    
    List<DigitalPrescription> findByDoctorAndStatusOrderByIssueDateDesc(User doctor, DigitalPrescription.PrescriptionStatus status);
    
    List<DigitalPrescription> findByPatientAndStatusOrderByIssueDateDesc(User patient, DigitalPrescription.PrescriptionStatus status);
    
    @Query("SELECT dp FROM DigitalPrescription dp WHERE dp.patient = :patient AND dp.status = 'ISSUED' AND dp.validUntil >= :today ORDER BY dp.issueDate DESC")
    List<DigitalPrescription> findActivePrescriptionsForPatient(@Param("patient") User patient, @Param("today") LocalDate today);
    
    @Query("SELECT dp FROM DigitalPrescription dp WHERE dp.doctor = :doctor AND dp.issueDate = :date ORDER BY dp.createdAt DESC")
    List<DigitalPrescription> findPrescriptionsIssuedByDoctorOnDate(@Param("doctor") User doctor, @Param("date") LocalDate date);
    
    @Query("SELECT dp FROM DigitalPrescription dp WHERE dp.status = 'ISSUED' AND dp.expiryDate <= :date")
    List<DigitalPrescription> findExpiringPrescriptions(@Param("date") LocalDate date);
    
    @Query("SELECT dp FROM DigitalPrescription dp WHERE dp.refillsRemaining > 0 AND dp.status = 'ISSUED' AND dp.validUntil >= :today")
    List<DigitalPrescription> findPrescriptionsEligibleForRefill(@Param("today") LocalDate today);
    
    Long countByDoctorAndStatus(User doctor, DigitalPrescription.PrescriptionStatus status);
    
    Long countByPatientAndStatus(User patient, DigitalPrescription.PrescriptionStatus status);
    
    @Query("SELECT COUNT(dp) FROM DigitalPrescription dp WHERE dp.doctor = :doctor AND dp.issueDate >= :since")
    Long countPrescriptionsIssuedSince(@Param("doctor") User doctor, @Param("since") LocalDate since);
    
    @Query("SELECT dp.type, COUNT(dp) FROM DigitalPrescription dp WHERE dp.doctor = :doctor GROUP BY dp.type")
    List<Object[]> getPrescriptionTypeStatistics(@Param("doctor") User doctor);
}
