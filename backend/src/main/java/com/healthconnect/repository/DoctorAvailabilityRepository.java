package com.healthconnect.repository;

import com.healthconnect.entity.DoctorAvailability;
import com.healthconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {
    
    Optional<DoctorAvailability> findByDoctor(User doctor);
    
    Optional<DoctorAvailability> findByDoctorId(Long doctorId);
}
