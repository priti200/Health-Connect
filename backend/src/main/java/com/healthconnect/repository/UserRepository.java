package com.healthconnect.repository;

import com.healthconnect.entity.User;
import com.healthconnect.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    boolean existsByLicenseNumber(String licenseNumber);
    
    List<User> findByRole(UserRole role);
    
    List<User> findByRoleAndIsActiveTrue(UserRole role);
    
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.isActive = true AND " +
           "(:specialization IS NULL OR u.specialization LIKE %:specialization%)")
    List<User> findDoctorsBySpecialization(@Param("role") UserRole role, 
                                          @Param("specialization") String specialization);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.isActive = true")
    long countByRoleAndIsActiveTrue(@Param("role") UserRole role);

    // Find doctors by specialization (case-insensitive)
    List<User> findByRoleAndSpecializationContainingIgnoreCaseAndIsActiveTrue(UserRole role, String specialization);

    // Find user by ID and role
    Optional<User> findByIdAndRoleAndIsActiveTrue(Long id, UserRole role);

    // Get distinct specializations
    @Query("SELECT DISTINCT u.specialization FROM User u WHERE u.role = 'DOCTOR' AND u.specialization IS NOT NULL AND u.isActive = true")
    List<String> findDistinctSpecializations();

    // Delete by email (for testing purposes)
    void deleteByEmail(String email);
}
