package com.healthconnect.service;

import com.healthconnect.entity.DigitalPrescription;
import com.healthconnect.entity.PrescriptionMedication;
import com.healthconnect.entity.User;
import com.healthconnect.entity.Appointment;
import com.healthconnect.entity.VideoConsultation;
import com.healthconnect.repository.DigitalPrescriptionRepository;
import com.healthconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DigitalPrescriptionService {
    
    private final DigitalPrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final InsuranceService insuranceService;
    
    @Transactional
    public DigitalPrescription createPrescription(DigitalPrescription prescription, User doctor) {
        log.info("Creating digital prescription for patient: {} by doctor: {}", 
                prescription.getPatient().getId(), doctor.getId());
        
        // Validate doctor authorization
        if (!doctor.isDoctor()) {
            throw new RuntimeException("Only doctors can create prescriptions");
        }
        
        // Generate prescription number
        String prescriptionNumber = generatePrescriptionNumber();
        prescription.setPrescriptionNumber(prescriptionNumber);
        prescription.setDoctor(doctor);
        prescription.setStatus(DigitalPrescription.PrescriptionStatus.DRAFT);
        prescription.setIssueDate(LocalDate.now());
        
        // Set expiry date (default 1 year for chronic, 30 days for acute)
        if (prescription.getType() == DigitalPrescription.PrescriptionType.CHRONIC) {
            prescription.setExpiryDate(LocalDate.now().plusYears(1));
            prescription.setValidUntil(LocalDate.now().plusYears(1));
        } else {
            prescription.setExpiryDate(LocalDate.now().plusDays(30));
            prescription.setValidUntil(LocalDate.now().plusDays(30));
        }
        
        // Generate verification code and QR code
        prescription.setVerificationCode(generateVerificationCode());
        prescription.setQrCode(generateQRCode(prescriptionNumber));
        
        prescription = prescriptionRepository.save(prescription);
        
        // Process insurance if patient has coverage
        if (prescription.getInsuranceApproved() != null && prescription.getInsuranceApproved()) {
            processInsuranceClaim(prescription);
        }
        
        log.info("Digital prescription created successfully: {}", prescription.getId());
        return prescription;
    }
    
    @Transactional
    public DigitalPrescription issuePrescription(Long prescriptionId, User doctor) {
        DigitalPrescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        
        // Validate doctor authorization
        if (!prescription.getDoctor().getId().equals(doctor.getId())) {
            throw new RuntimeException("Unauthorized access to prescription");
        }
        
        if (prescription.getStatus() != DigitalPrescription.PrescriptionStatus.DRAFT) {
            throw new RuntimeException("Only draft prescriptions can be issued");
        }
        
        // Generate digital signature
        prescription.setDigitalSignature(generateDigitalSignature(prescription, doctor));
        prescription.setStatus(DigitalPrescription.PrescriptionStatus.ISSUED);
        
        prescription = prescriptionRepository.save(prescription);
        
        // Send notification to patient
        notificationService.sendPrescriptionIssuedNotification(prescription);
        
        log.info("Prescription issued successfully: {}", prescription.getId());
        return prescription;
    }
    
    @Transactional
    public DigitalPrescription sendToPharmacy(Long prescriptionId, String pharmacyName, 
                                            String pharmacyAddress, String pharmacyPhone, User user) {
        DigitalPrescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        
        // Validate user authorization (doctor or patient)
        if (!prescription.getDoctor().getId().equals(user.getId()) && 
            !prescription.getPatient().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to prescription");
        }
        
        if (prescription.getStatus() != DigitalPrescription.PrescriptionStatus.ISSUED) {
            throw new RuntimeException("Only issued prescriptions can be sent to pharmacy");
        }
        
        prescription.setPharmacyName(pharmacyName);
        prescription.setPharmacyAddress(pharmacyAddress);
        prescription.setPharmacyPhone(pharmacyPhone);
        prescription.setStatus(DigitalPrescription.PrescriptionStatus.SENT_TO_PHARMACY);
        
        prescription = prescriptionRepository.save(prescription);
        
        log.info("Prescription sent to pharmacy: {}", prescription.getId());
        return prescription;
    }
    
    @Transactional
    public DigitalPrescription requestRefill(Long prescriptionId, User patient) {
        DigitalPrescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        
        // Validate patient authorization
        if (!prescription.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Unauthorized access to prescription");
        }
        
        if (prescription.getRefillsRemaining() <= 0) {
            throw new RuntimeException("No refills remaining for this prescription");
        }
        
        if (prescription.getValidUntil().isBefore(LocalDate.now())) {
            throw new RuntimeException("Prescription has expired");
        }
        
        // Decrease refills remaining
        prescription.setRefillsRemaining(prescription.getRefillsRemaining() - 1);
        
        // If sent to pharmacy, update status
        if (prescription.getStatus() == DigitalPrescription.PrescriptionStatus.SENT_TO_PHARMACY) {
            prescription.setStatus(DigitalPrescription.PrescriptionStatus.PARTIALLY_DISPENSED);
        }
        
        prescription = prescriptionRepository.save(prescription);
        
        log.info("Refill requested for prescription: {}", prescription.getId());
        return prescription;
    }
    
    @Transactional
    public DigitalPrescription cancelPrescription(Long prescriptionId, String reason, User user) {
        DigitalPrescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        
        // Validate user authorization (only doctor can cancel)
        if (!prescription.getDoctor().getId().equals(user.getId())) {
            throw new RuntimeException("Only the prescribing doctor can cancel this prescription");
        }
        
        if (prescription.getStatus() == DigitalPrescription.PrescriptionStatus.CANCELLED) {
            throw new RuntimeException("Prescription is already cancelled");
        }
        
        prescription.setStatus(DigitalPrescription.PrescriptionStatus.CANCELLED);
        prescription.setNotes(prescription.getNotes() + "\nCancellation reason: " + reason);
        
        prescription = prescriptionRepository.save(prescription);
        
        log.info("Prescription cancelled: {}", prescription.getId());
        return prescription;
    }
    
    public DigitalPrescription getPrescription(Long prescriptionId, User user) {
        DigitalPrescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        
        // Validate user authorization
        if (!prescription.getDoctor().getId().equals(user.getId()) && 
            !prescription.getPatient().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to prescription");
        }
        
        return prescription;
    }
    
    public List<DigitalPrescription> getDoctorPrescriptions(User doctor) {
        return prescriptionRepository.findByDoctorOrderByIssueDateDesc(doctor);
    }
    
    public List<DigitalPrescription> getPatientPrescriptions(User patient) {
        return prescriptionRepository.findByPatientOrderByIssueDateDesc(patient);
    }
    
    public Page<DigitalPrescription> getDoctorPrescriptions(User doctor, Pageable pageable) {
        return prescriptionRepository.findByDoctorOrderByIssueDateDesc(doctor, pageable);
    }
    
    public Page<DigitalPrescription> getPatientPrescriptions(User patient, Pageable pageable) {
        return prescriptionRepository.findByPatientOrderByIssueDateDesc(patient, pageable);
    }
    
    public List<DigitalPrescription> getActivePrescriptions(User patient) {
        return prescriptionRepository.findActivePrescriptionsForPatient(patient, LocalDate.now());
    }
    
    public List<DigitalPrescription> getExpiringPrescriptions(User patient, int daysAhead) {
        LocalDate cutoffDate = LocalDate.now().plusDays(daysAhead);
        return prescriptionRepository.findActivePrescriptionsForPatient(patient, LocalDate.now())
                .stream()
                .filter(p -> p.getValidUntil().isBefore(cutoffDate))
                .toList();
    }
    
    // Helper methods
    private String generatePrescriptionNumber() {
        return "RX" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    private String generateVerificationCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    private String generateQRCode(String prescriptionNumber) {
        // In a real implementation, this would generate an actual QR code
        return "QR_" + prescriptionNumber;
    }
    
    private String generateDigitalSignature(DigitalPrescription prescription, User doctor) {
        // In a real implementation, this would use proper digital signature algorithms
        return "DS_" + doctor.getId() + "_" + prescription.getId() + "_" + System.currentTimeMillis();
    }
    
    private void processInsuranceClaim(DigitalPrescription prescription) {
        try {
            insuranceService.processClaimForPrescription(prescription);
        } catch (Exception e) {
            log.warn("Failed to process insurance claim for prescription: {}", prescription.getId(), e);
        }
    }
}
