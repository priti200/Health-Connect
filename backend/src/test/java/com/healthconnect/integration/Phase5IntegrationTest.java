package com.healthconnect.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthconnect.entity.DigitalPrescription;
import com.healthconnect.entity.User;
import com.healthconnect.entity.UserRole;
import com.healthconnect.entity.VideoConsultation;
import com.healthconnect.repository.DigitalPrescriptionRepository;
import com.healthconnect.repository.UserRepository;
import com.healthconnect.repository.VideoConsultationRepository;
import com.healthconnect.service.DigitalPrescriptionService;
import com.healthconnect.service.InsuranceService;
import com.healthconnect.service.InternationalizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Transactional
public class Phase5IntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DigitalPrescriptionService prescriptionService;

    @Autowired
    private InsuranceService insuranceService;

    @Autowired
    private InternationalizationService i18nService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DigitalPrescriptionRepository prescriptionRepository;

    @Autowired
    private VideoConsultationRepository consultationRepository;

    private User testDoctor;
    private User testPatient;
    private VideoConsultation testConsultation;

    @BeforeEach
    void setUp() {
        // Initialize MockMvc
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        // Create test users
        testDoctor = new User();
        testDoctor.setEmail("test.doctor@healthconnect.com");
        testDoctor.setPassword("password123");
        testDoctor.setFullName("Dr. Test Doctor");
        testDoctor.setRole(UserRole.DOCTOR);
        testDoctor.setSpecialization("General Medicine");
        testDoctor = userRepository.save(testDoctor);

        testPatient = new User();
        testPatient.setEmail("test.patient@healthconnect.com");
        testPatient.setPassword("password123");
        testPatient.setFullName("Test Patient");
        testPatient.setRole(UserRole.PATIENT);
        testPatient = userRepository.save(testPatient);

        // Create test consultation
        testConsultation = new VideoConsultation();
        testConsultation.setDoctor(testDoctor);
        testConsultation.setPatient(testPatient);
        testConsultation.setType(VideoConsultation.ConsultationType.ROUTINE_CHECKUP);
        testConsultation.setStatus(VideoConsultation.ConsultationStatus.COMPLETED);
        testConsultation.setScheduledStartTime(LocalDateTime.now().minusHours(1));
        testConsultation.setActualStartTime(LocalDateTime.now().minusHours(1));
        testConsultation.setEndTime(LocalDateTime.now().minusMinutes(30));
        testConsultation.setDurationMinutes(30);
        testConsultation = consultationRepository.save(testConsultation);
    }

    @Test
    @WithMockUser(username = "test.doctor@healthconnect.com", roles = {"DOCTOR"})
    void testDigitalPrescriptionWorkflow() throws Exception {
        // Test 1: Create prescription
        DigitalPrescription prescription = new DigitalPrescription();
        prescription.setPatient(testPatient);
        prescription.setType(DigitalPrescription.PrescriptionType.ACUTE);
        prescription.setDiagnosis("Common Cold");
        prescription.setSymptoms("Cough, runny nose");
        prescription.setInstructions("Take as directed");
        prescription.setRefillsAllowed(2);

        String prescriptionJson = objectMapper.writeValueAsString(prescription);

        mockMvc.perform(post("/api/digital-prescription/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(prescriptionJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prescriptionNumber").exists())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        // Test 2: Issue prescription
        List<DigitalPrescription> prescriptions = prescriptionRepository.findByDoctorOrderByIssueDateDesc(testDoctor);
        assertFalse(prescriptions.isEmpty());
        
        Long prescriptionId = prescriptions.get(0).getId();

        mockMvc.perform(post("/api/digital-prescription/" + prescriptionId + "/issue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ISSUED"))
                .andExpect(jsonPath("$.digitalSignature").exists());

        // Test 3: Send to pharmacy
        Map<String, String> pharmacyInfo = Map.of(
            "pharmacyName", "Test Pharmacy",
            "pharmacyAddress", "123 Test St",
            "pharmacyPhone", "555-0123"
        );

        mockMvc.perform(post("/api/digital-prescription/" + prescriptionId + "/send-to-pharmacy")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(pharmacyInfo)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SENT_TO_PHARMACY"))
                .andExpect(jsonPath("$.pharmacyName").value("Test Pharmacy"));
    }

    @Test
    @WithMockUser(username = "test.patient@healthconnect.com", roles = {"PATIENT"})
    void testPatientPrescriptionAccess() throws Exception {
        // Create and issue a prescription first
        DigitalPrescription prescription = new DigitalPrescription();
        prescription.setDoctor(testDoctor);
        prescription.setPatient(testPatient);
        prescription.setType(DigitalPrescription.PrescriptionType.CHRONIC);
        prescription.setStatus(DigitalPrescription.PrescriptionStatus.ISSUED);
        prescription.setIssueDate(LocalDate.now());
        prescription.setRefillsAllowed(5);
        prescription.setRefillsRemaining(5);
        prescription.setValidUntil(LocalDate.now().plusMonths(6));
        prescription = prescriptionRepository.save(prescription);

        // Test 1: Get patient prescriptions
        mockMvc.perform(get("/api/digital-prescription/patient/prescriptions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].id").value(prescription.getId()));

        // Test 2: Get active prescriptions
        mockMvc.perform(get("/api/digital-prescription/patient/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Test 3: Request refill
        mockMvc.perform(post("/api/digital-prescription/" + prescription.getId() + "/refill"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refillsRemaining").value(4));
    }

    @Test
    @WithMockUser(username = "test.patient@healthconnect.com", roles = {"PATIENT"})
    void testInsuranceIntegration() throws Exception {
        // Test 1: Check eligibility
        mockMvc.perform(get("/api/insurance/eligibility/prescription"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eligible").isBoolean())
                .andExpect(jsonPath("$.coveragePercentage").exists());

        // Test 2: Get coverage summary
        mockMvc.perform(get("/api/insurance/coverage-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value(testPatient.getId()))
                .andExpect(jsonPath("$.prescriptionCoverage").exists())
                .andExpect(jsonPath("$.consultationCoverage").exists())
                .andExpect(jsonPath("$.appointmentCoverage").exists());

        // Test 3: Estimate cost
        Map<String, Object> costRequest = Map.of(
            "serviceType", "prescription",
            "baseCost", 100.0
        );

        mockMvc.perform(post("/api/insurance/estimate-cost")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(costRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.baseCost").value(100.0))
                .andExpect(jsonPath("$.insuranceCoverage").exists())
                .andExpect(jsonPath("$.patientCost").exists());

        // Test 4: Get supported providers
        mockMvc.perform(get("/api/insurance/providers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].consultationCoverage").exists());
    }

    @Test
    void testInternationalizationService() throws Exception {
        // Test 1: Get supported languages
        mockMvc.perform(get("/api/i18n/languages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.languages").isArray())
                .andExpect(jsonPath("$.languageInfo").exists());

        // Test 2: Get translations
        mockMvc.perform(get("/api/i18n/translations/es"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.language").value("es"))
                .andExpect(jsonPath("$.translations").exists())
                .andExpect(jsonPath("$.count").isNumber());

        // Test 3: Translate single key
        Map<String, String> translateRequest = Map.of(
            "key", "welcome",
            "language", "es"
        );

        mockMvc.perform(post("/api/i18n/translate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(translateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("welcome"))
                .andExpect(jsonPath("$.language").value("es"))
                .andExpect(jsonPath("$.translation").exists());

        // Test 4: Batch translate
        Map<String, Object> batchRequest = Map.of(
            "keys", List.of("welcome", "login", "logout"),
            "language", "fr"
        );

        mockMvc.perform(post("/api/i18n/translate/batch")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(batchRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.language").value("fr"))
                .andExpect(jsonPath("$.translations").exists())
                .andExpect(jsonPath("$.count").value(3));

        // Test 5: Detect language
        Map<String, String> detectRequest = Map.of(
            "text", "Hola, buenos días"
        );

        mockMvc.perform(post("/api/i18n/detect-language")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(detectRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.detectedLanguage").value("es"))
                .andExpect(jsonPath("$.confidence").exists());
    }

    @Test
    @WithMockUser(username = "test.doctor@healthconnect.com", roles = {"DOCTOR"})
    void testEndToEndTelemedicineWorkflow() throws Exception {
        // Test complete workflow: consultation -> prescription -> insurance
        
        // Step 1: Create prescription after consultation
        DigitalPrescription prescription = new DigitalPrescription();
        prescription.setPatient(testPatient);
        prescription.setConsultation(testConsultation);
        prescription.setType(DigitalPrescription.PrescriptionType.ACUTE);
        prescription.setDiagnosis("Hypertension");
        prescription.setSymptoms("High blood pressure");
        prescription.setInstructions("Take once daily with food");
        prescription.setRefillsAllowed(3);

        String prescriptionJson = objectMapper.writeValueAsString(prescription);

        // Create prescription
        String response = mockMvc.perform(post("/api/digital-prescription/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(prescriptionJson))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        DigitalPrescription createdPrescription = objectMapper.readValue(response, DigitalPrescription.class);

        // Step 2: Issue prescription
        mockMvc.perform(post("/api/digital-prescription/" + createdPrescription.getId() + "/issue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ISSUED"));

        // Step 3: Process insurance claim (this would be automatic in real scenario)
        InsuranceService.InsuranceClaim claim = insuranceService.processClaimForPrescription(createdPrescription);
        assertNotNull(claim);
        assertEquals(createdPrescription.getId(), claim.getPrescriptionId());

        // Step 4: Send to pharmacy
        Map<String, String> pharmacyInfo = Map.of(
            "pharmacyName", "HealthConnect Pharmacy",
            "pharmacyAddress", "456 Health Ave",
            "pharmacyPhone", "555-0456"
        );

        mockMvc.perform(post("/api/digital-prescription/" + createdPrescription.getId() + "/send-to-pharmacy")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(pharmacyInfo)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SENT_TO_PHARMACY"));

        // Verify the complete workflow
        DigitalPrescription finalPrescription = prescriptionRepository.findById(createdPrescription.getId()).orElse(null);
        assertNotNull(finalPrescription);
        assertEquals(DigitalPrescription.PrescriptionStatus.SENT_TO_PHARMACY, finalPrescription.getStatus());
        assertEquals("HealthConnect Pharmacy", finalPrescription.getPharmacyName());
        assertTrue(finalPrescription.getInsuranceApproved());
    }

    @Test
    void testHealthChecks() throws Exception {
        // Test all service health endpoints
        mockMvc.perform(get("/api/digital-prescription/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("healthy"))
                .andExpect(jsonPath("$.service").value("DigitalPrescriptionService"));

        mockMvc.perform(get("/api/insurance/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("healthy"))
                .andExpect(jsonPath("$.service").value("InsuranceService"));

        mockMvc.perform(get("/api/i18n/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("healthy"))
                .andExpect(jsonPath("$.service").value("InternationalizationService"));
    }
}
