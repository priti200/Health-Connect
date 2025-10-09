package com.healthconnect.service;

import com.healthconnect.entity.*;
import com.healthconnect.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataInitializationService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppointmentRepository appointmentRepository;
    
    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Initializing test data...");
        createTestAccounts();
        createTestAppointments();
        // Add real users for demo
        createRealUsers();

        log.info("Test data initialization completed.");
    }
    
    private void createTestAccounts() {
        // Create test doctor account
        if (!userRepository.existsByEmail("doctor.test@healthconnect.com")) {
            User doctor = new User();
            doctor.setFullName("Dr. John Smith");
            doctor.setEmail("doctor.test@healthconnect.com");
            doctor.setPassword(passwordEncoder.encode("password123"));
            doctor.setRole(UserRole.DOCTOR);
            doctor.setSpecialization("Cardiology");
            doctor.setLicenseNumber("MD123456");
            doctor.setAffiliation("HealthConnect Medical Center");
            doctor.setYearsOfExperience(10);
            doctor.setPhoneNumber("+1-555-0101");
            doctor.setAddress("123 Medical Center Dr, Healthcare City, HC 12345");
            doctor.setIsActive(true);

            userRepository.save(doctor);
            log.info("Created test doctor account: {}", doctor.getEmail());
        } else {
            log.info("Test doctor account already exists: doctor.test@healthconnect.com");
        }
        
        // Create test patient account
        if (!userRepository.existsByEmail("patient.test@healthconnect.com")) {
            User patient = new User();
            patient.setFullName("Jane Doe");
            patient.setEmail("patient.test@healthconnect.com");
            patient.setPassword(passwordEncoder.encode("password123"));
            patient.setRole(UserRole.PATIENT);
            patient.setPhoneNumber("+1-555-0102");
            patient.setAddress("456 Patient St, Healthcare City, HC 12345");
            patient.setIsActive(true);

            userRepository.save(patient);
            log.info("Created test patient account: {}", patient.getEmail());
        } else {
            log.info("Test patient account already exists: patient.test@healthconnect.com");
        }
        
        // Create additional test doctor
        if (!userRepository.existsByEmail("doctor2.test@healthconnect.com")) {
            User doctor2 = new User();
            doctor2.setFullName("Dr. Sarah Johnson");
            doctor2.setEmail("doctor2.test@healthconnect.com");
            doctor2.setPassword(passwordEncoder.encode("password123"));
            doctor2.setRole(UserRole.DOCTOR);
            doctor2.setSpecialization("Dermatology");
            doctor2.setLicenseNumber("MD789012");
            doctor2.setAffiliation("HealthConnect Skin Clinic");
            doctor2.setYearsOfExperience(8);
            doctor2.setPhoneNumber("+1-555-0103");
            doctor2.setAddress("789 Dermatology Ave, Healthcare City, HC 12345");
            doctor2.setIsActive(true);
            
            userRepository.save(doctor2);
            log.info("Created additional test doctor account: {}", doctor2.getEmail());
        }
        
        // Create additional test patient
        if (!userRepository.existsByEmail("patient2.test@healthconnect.com")) {
            User patient2 = new User();
            patient2.setFullName("Bob Wilson");
            patient2.setEmail("patient2.test@healthconnect.com");
            patient2.setPassword(passwordEncoder.encode("password123"));
            patient2.setRole(UserRole.PATIENT);
            patient2.setPhoneNumber("+1-555-0104");
            patient2.setAddress("321 Wellness Blvd, Healthcare City, HC 12345");
            patient2.setIsActive(true);
            
            userRepository.save(patient2);
            log.info("Created additional test patient account: {}", patient2.getEmail());
        }
    }

    private void createTestAppointments() {
        // Get users for creating appointments
        User doctor = userRepository.findByEmail("doctor.test@healthconnect.com").orElse(null);
        User patient = userRepository.findByEmail("patient.test@healthconnect.com").orElse(null);
        User doctor2 = userRepository.findByEmail("doctor2.test@healthconnect.com").orElse(null);
        User patient2 = userRepository.findByEmail("patient2.test@healthconnect.com").orElse(null);

        if (doctor == null || patient == null || doctor2 == null || patient2 == null) {
            log.warn("Cannot create test appointments - some users not found");
            return;
        }

        // Check if appointments already exist
        if (appointmentRepository.count() > 0) {
            log.info("Test appointments already exist");
            return;
        }

        // Create test appointments for video calling - DEMO MODE (current time)
        LocalTime currentTime = LocalTime.now();
        LocalTime demoTime1 = currentTime.minusMinutes(5); // Started 5 minutes ago

        Appointment appointment1 = new Appointment();
        appointment1.setDoctor(doctor);
        appointment1.setPatient(patient);
        appointment1.setDate(LocalDate.now()); // TODAY
        appointment1.setStartTime(demoTime1);
        appointment1.setEndTime(demoTime1.plusMinutes(30));
        appointment1.setType(AppointmentType.VIDEO_CALL);
        appointment1.setStatus(AppointmentStatus.CONFIRMED);
        appointment1.setReasonForVisit("🎯 DEMO: General Video Consultation");
        appointment1.setMeetingLink("https://healthconnect.twilio.com/video/room-demo-" + System.currentTimeMillis());
        appointmentRepository.save(appointment1);

        LocalTime demoTime2 = currentTime.plusMinutes(10); // 10 minutes from now

        Appointment appointment2 = new Appointment();
        appointment2.setDoctor(doctor2);
        appointment2.setPatient(patient2);
        appointment2.setDate(LocalDate.now()); // TODAY
        appointment2.setStartTime(demoTime2);
        appointment2.setEndTime(demoTime2.plusMinutes(30));
        appointment2.setType(AppointmentType.VIDEO_CALL);
        appointment2.setStatus(AppointmentStatus.CONFIRMED);
        appointment2.setReasonForVisit("🎯 DEMO: Dermatology Video Consultation");
        appointment2.setMeetingLink("https://healthconnect.twilio.com/video/room-demo-" + (System.currentTimeMillis() + 1));
        appointmentRepository.save(appointment2);

        // Create cross appointments for testing chat - DEMO MODE
        LocalTime demoTime3 = currentTime.minusMinutes(10); // Started 10 minutes ago

        Appointment appointment3 = new Appointment();
        appointment3.setDoctor(doctor);
        appointment3.setPatient(patient2);
        appointment3.setDate(LocalDate.now()); // TODAY
        appointment3.setStartTime(demoTime3);
        appointment3.setEndTime(demoTime3.plusMinutes(30));
        appointment3.setType(AppointmentType.VIDEO_CALL);
        appointment3.setStatus(AppointmentStatus.CONFIRMED);
        appointment3.setReasonForVisit("🎯 DEMO: Follow-up Video Consultation");
        appointment3.setMeetingLink("https://healthconnect.twilio.com/video/room-demo-" + (System.currentTimeMillis() + 2));
        appointmentRepository.save(appointment3);

        log.info("Created {} test appointments for video calling", 3);
    }

    private void createRealUsers() {
        // Create real doctor
        if (!userRepository.existsByEmail("dr.sarah.johnson@healthconnect.com")) {
            User realDoctor = new User();
            realDoctor.setFullName("Dr. Sarah Johnson");
            realDoctor.setEmail("dr.sarah.johnson@healthconnect.com");
            realDoctor.setPassword(passwordEncoder.encode("doctor123"));
            realDoctor.setRole(UserRole.DOCTOR);
            realDoctor.setSpecialization("Cardiology");
            realDoctor.setLicenseNumber("MD12345");
            realDoctor.setYearsOfExperience(10);
            realDoctor.setAffiliation("City General Hospital");
            realDoctor.setPhoneNumber("+1-555-0201");
            realDoctor.setAddress("456 Medical Center Dr, Healthcare City, HC 12345");
            realDoctor.setIsActive(true);
            userRepository.save(realDoctor);
            log.info("Created real doctor: {}", realDoctor.getEmail());
        }

        // Create real patient
        if (!userRepository.existsByEmail("john.smith@email.com")) {
            User realPatient = new User();
            realPatient.setFullName("John Smith");
            realPatient.setEmail("john.smith@email.com");
            realPatient.setPassword(passwordEncoder.encode("patient123"));
            realPatient.setRole(UserRole.PATIENT);
            realPatient.setPhoneNumber("+1-555-0202");
            realPatient.setAddress("123 Main Street, City, State 12345");
            realPatient.setIsActive(true);
            userRepository.save(realPatient);
            log.info("Created real patient: {}", realPatient.getEmail());
        }

        // Create appointments between real users
        createRealAppointments();
    }

    private void createRealAppointments() {
        User doctor = userRepository.findByEmail("dr.sarah.johnson@healthconnect.com").orElse(null);
        User patient = userRepository.findByEmail("john.smith@email.com").orElse(null);

        if (doctor != null && patient != null) {
            // Create a video call appointment for today
            Appointment videoAppointment = new Appointment();
            videoAppointment.setDoctor(doctor);
            videoAppointment.setPatient(patient);
            videoAppointment.setDate(LocalDate.now());
            videoAppointment.setStartTime(LocalTime.of(15, 0)); // 3:00 PM
            videoAppointment.setEndTime(LocalTime.of(15, 30));   // 3:30 PM
            videoAppointment.setType(AppointmentType.VIDEO_CALL);
            videoAppointment.setStatus(AppointmentStatus.CONFIRMED);
            videoAppointment.setReasonForVisit("Cardiology Consultation - Follow-up");
            videoAppointment.setNotes("Video consultation for cardiac health assessment");
            videoAppointment.setMeetingLink("https://healthconnect.video/room-real-" + System.currentTimeMillis());
            appointmentRepository.save(videoAppointment);

            // Create another video call appointment for later today
            Appointment videoAppointment2 = new Appointment();
            videoAppointment2.setDoctor(doctor);
            videoAppointment2.setPatient(patient);
            videoAppointment2.setDate(LocalDate.now());
            videoAppointment2.setStartTime(LocalTime.of(17, 0)); // 5:00 PM
            videoAppointment2.setEndTime(LocalTime.of(17, 30));   // 5:30 PM
            videoAppointment2.setType(AppointmentType.VIDEO_CALL);
            videoAppointment2.setStatus(AppointmentStatus.CONFIRMED);
            videoAppointment2.setReasonForVisit("Medication Review");
            videoAppointment2.setNotes("Review current medications and discuss side effects");
            videoAppointment2.setMeetingLink("https://healthconnect.video/room-real-" + (System.currentTimeMillis() + 1));
            appointmentRepository.save(videoAppointment2);

            log.info("Created real appointments between Dr. Sarah Johnson and John Smith");
        }
    }
}
