package com.healthconnect.config;

import com.healthconnect.entity.Appointment;
import com.healthconnect.entity.AppointmentStatus;
import com.healthconnect.entity.AppointmentType;
import com.healthconnect.entity.User;
import com.healthconnect.entity.UserRole;
import com.healthconnect.repository.AppointmentRepository;
import com.healthconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        createTestUsers();
    }

    private void createTestUsers() {
        // Create test patient
        if (!userRepository.existsByEmail("patient.test@healthconnect.com")) {
            User patient = new User();
            patient.setEmail("patient.test@healthconnect.com");
            patient.setPassword(passwordEncoder.encode("password123"));
            patient.setFullName("Test Patient");
            patient.setRole(UserRole.PATIENT);
            patient.setPhoneNumber("1234567890");
            patient.setDateOfBirth(java.time.LocalDate.of(1990, 1, 1));
            patient.setGender("Male");
            patient.setAddress("123 Test Street");
            userRepository.save(patient);
            log.info("Created test patient: {}", patient.getEmail());
        }

        // Create test doctor
        if (!userRepository.existsByEmail("doctor.test@healthconnect.com")) {
            User doctor = new User();
            doctor.setEmail("doctor.test@healthconnect.com");
            doctor.setPassword(passwordEncoder.encode("password123"));
            doctor.setFullName("Dr. Test Doctor");
            doctor.setRole(UserRole.DOCTOR);
            doctor.setPhoneNumber("0987654321");
            doctor.setDateOfBirth(java.time.LocalDate.of(1980, 1, 1));
            doctor.setGender("Female");
            doctor.setAddress("456 Medical Center");
            doctor.setSpecialization("General Medicine");
            doctor.setLicenseNumber("DOC123456");
            doctor.setExperience(10);
            doctor.setConsultationFee(100.0);
            userRepository.save(doctor);
            log.info("Created test doctor: {}", doctor.getEmail());
        }

        // Create additional test doctor
        if (!userRepository.existsByEmail("doctor2.test@healthconnect.com")) {
            User doctor2 = new User();
            doctor2.setEmail("doctor2.test@healthconnect.com");
            doctor2.setPassword(passwordEncoder.encode("password123"));
            doctor2.setFullName("Dr. Sarah Johnson");
            doctor2.setRole(UserRole.DOCTOR);
            doctor2.setPhoneNumber("5555551234");
            doctor2.setDateOfBirth(java.time.LocalDate.of(1985, 5, 15));
            doctor2.setGender("Female");
            doctor2.setAddress("789 Health Plaza");
            doctor2.setSpecialization("Cardiology");
            doctor2.setLicenseNumber("DOC789012");
            doctor2.setExperience(8);
            doctor2.setConsultationFee(150.0);
            userRepository.save(doctor2);
            log.info("Created test doctor 2: {}", doctor2.getEmail());
        }

        // Create additional test doctors to ensure we have enough
        for (int i = 3; i <= 10; i++) {
            String email = "doctor" + i + ".test@healthconnect.com";
            if (!userRepository.existsByEmail(email)) {
                User doctor = new User();
                doctor.setEmail(email);
                doctor.setPassword(passwordEncoder.encode("password123"));
                doctor.setFullName("Dr. Test Doctor " + i);
                doctor.setRole(UserRole.DOCTOR);
                doctor.setPhoneNumber("555555" + String.format("%04d", i));
                doctor.setDateOfBirth(java.time.LocalDate.of(1980 + i, 1, 1));
                doctor.setGender(i % 2 == 0 ? "Female" : "Male");
                doctor.setAddress(i + "00 Medical Center");
                doctor.setSpecialization(getSpecialization(i));
                doctor.setLicenseNumber("DOC" + String.format("%06d", i));
                doctor.setExperience(5 + i);
                doctor.setConsultationFee(100.0 + (i * 25));
                userRepository.save(doctor);
                log.info("Created test doctor {}: {}", i, doctor.getEmail());
            }
        }

        // Create test appointments
        createTestAppointments();

        log.info("Data initialization completed");
    }

    private String getSpecialization(int index) {
        String[] specializations = {
            "General Medicine", "Cardiology", "Dermatology", "Neurology",
            "Orthopedics", "Pediatrics", "Psychiatry", "Radiology"
        };
        return specializations[index % specializations.length];
    }

    private void createTestAppointments() {
        // Get test users
        User patient = userRepository.findByEmail("patient.test@healthconnect.com").orElse(null);
        User doctor = userRepository.findByEmail("doctor.test@healthconnect.com").orElse(null);

        if (patient == null || doctor == null) {
            log.warn("Cannot create test appointments - test users not found");
            return;
        }

        // Create test appointments for the next few days
        for (int i = 1; i <= 10; i++) {
            if (!appointmentRepository.existsById((long) i)) {
                Appointment appointment = new Appointment();
                appointment.setPatient(patient);
                appointment.setDoctor(doctor);
                appointment.setDate(java.time.LocalDate.now().plusDays(i % 7));
                appointment.setStartTime(java.time.LocalTime.of(9 + (i % 8), 0));
                appointment.setEndTime(java.time.LocalTime.of(9 + (i % 8) + 1, 0));
                appointment.setType(i % 2 == 0 ? AppointmentType.VIDEO_CALL : AppointmentType.IN_PERSON);
                appointment.setStatus(AppointmentStatus.CONFIRMED);
                appointment.setReasonForVisit("Test appointment " + i);
                appointment.setNotes("This is a test appointment for development purposes");

                appointmentRepository.save(appointment);
                log.info("Created test appointment {}: {} with {}", i, appointment.getDate(), appointment.getStartTime());
            }
        }
    }
}
