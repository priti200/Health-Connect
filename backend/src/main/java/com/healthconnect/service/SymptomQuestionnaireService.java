package com.healthconnect.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthconnect.entity.*;
import com.healthconnect.repository.SymptomQuestionnaireRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SymptomQuestionnaireService {
    
    private final SymptomQuestionnaireRepository questionnaireRepository;
    private final GeminiApiService geminiApiService;
    private final ObjectMapper objectMapper;
    
    // Predefined questionnaire templates
    private static final Map<SymptomQuestionnaire.QuestionnaireType, List<QuestionTemplate>> QUESTIONNAIRE_TEMPLATES = new HashMap<>();
    
    static {
        // General Symptoms Questionnaire
        QUESTIONNAIRE_TEMPLATES.put(SymptomQuestionnaire.QuestionnaireType.GENERAL_SYMPTOMS, Arrays.asList(
            new QuestionTemplate("primary_symptoms", "What are your main symptoms?", QuestionType.MULTI_SELECT, 
                Arrays.asList("Fever", "Headache", "Fatigue", "Nausea", "Dizziness", "Pain", "Other"), true),
            new QuestionTemplate("symptom_duration", "How long have you been experiencing these symptoms?", QuestionType.SINGLE_SELECT,
                Arrays.asList("Less than 24 hours", "1-3 days", "4-7 days", "1-2 weeks", "More than 2 weeks"), true),
            new QuestionTemplate("symptom_severity", "How would you rate the severity of your symptoms?", QuestionType.SCALE,
                Arrays.asList("1", "2", "3", "4", "5", "6", "7", "8", "9", "10"), true),
            new QuestionTemplate("pain_location", "Where is the pain located? (if applicable)", QuestionType.MULTI_SELECT,
                Arrays.asList("Head", "Neck", "Chest", "Abdomen", "Back", "Arms", "Legs", "Other", "No pain"), false),
            new QuestionTemplate("associated_symptoms", "Do you have any of these associated symptoms?", QuestionType.MULTI_SELECT,
                Arrays.asList("Shortness of breath", "Chest pain", "Rapid heartbeat", "Confusion", "Severe headache", "High fever", "None"), false)
        ));
        
        // Cardiovascular Questionnaire
        QUESTIONNAIRE_TEMPLATES.put(SymptomQuestionnaire.QuestionnaireType.CARDIOVASCULAR, Arrays.asList(
            new QuestionTemplate("breathing_symptoms", "Are you experiencing any breathing difficulties?", QuestionType.MULTI_SELECT,
                Arrays.asList("Shortness of breath", "Wheezing", "Cough", "Chest tightness", "None"), true),
            new QuestionTemplate("cough_type", "If you have a cough, what type is it?", QuestionType.SINGLE_SELECT,
                Arrays.asList("Dry cough", "Productive cough", "Persistent cough", "No cough"), false)
        ));

        // Neurological Questionnaire
        QUESTIONNAIRE_TEMPLATES.put(SymptomQuestionnaire.QuestionnaireType.NEUROLOGICAL, Arrays.asList(
            new QuestionTemplate("neurological_symptoms", "Are you experiencing any neurological symptoms?", QuestionType.MULTI_SELECT,
                Arrays.asList("Headache", "Dizziness", "Memory problems", "Confusion", "Numbness", "Weakness", "None"), true)
        ));

        // Gastrointestinal Questionnaire
        QUESTIONNAIRE_TEMPLATES.put(SymptomQuestionnaire.QuestionnaireType.GASTROINTESTINAL, Arrays.asList(
            new QuestionTemplate("digestive_symptoms", "Are you experiencing any digestive symptoms?", QuestionType.MULTI_SELECT,
                Arrays.asList("Nausea", "Vomiting", "Diarrhea", "Constipation", "Abdominal pain", "None"), true)
        ));

        // Musculoskeletal Questionnaire
        QUESTIONNAIRE_TEMPLATES.put(SymptomQuestionnaire.QuestionnaireType.MUSCULOSKELETAL, Arrays.asList(
            new QuestionTemplate("musculoskeletal_symptoms", "Are you experiencing any muscle or joint symptoms?", QuestionType.MULTI_SELECT,
                Arrays.asList("Joint pain", "Muscle pain", "Stiffness", "Swelling", "Limited mobility", "None"), true)
        ));

        // Dermatological Questionnaire
        QUESTIONNAIRE_TEMPLATES.put(SymptomQuestionnaire.QuestionnaireType.DERMATOLOGICAL, Arrays.asList(
            new QuestionTemplate("skin_symptoms", "Are you experiencing any skin symptoms?", QuestionType.MULTI_SELECT,
                Arrays.asList("Rash", "Itching", "Redness", "Swelling", "Lesions", "None"), true)
        ));

        // Mental Health Questionnaire
        QUESTIONNAIRE_TEMPLATES.put(SymptomQuestionnaire.QuestionnaireType.MENTAL_HEALTH, Arrays.asList(
            new QuestionTemplate("mood_symptoms", "Are you experiencing any mood-related symptoms?", QuestionType.MULTI_SELECT,
                Arrays.asList("Depression", "Anxiety", "Mood swings", "Sleep problems", "Concentration issues", "None"), true)
        ));
        
        // Emergency Assessment
        QUESTIONNAIRE_TEMPLATES.put(SymptomQuestionnaire.QuestionnaireType.EMERGENCY_ASSESSMENT, Arrays.asList(
            new QuestionTemplate("emergency_symptoms", "Are you experiencing any of these emergency symptoms?", QuestionType.MULTI_SELECT,
                Arrays.asList("Severe chest pain", "Difficulty breathing", "Severe bleeding", "Loss of consciousness", "Severe allergic reaction", "Stroke symptoms", "None"), true),
            new QuestionTemplate("pain_severity", "If you have pain, how severe is it?", QuestionType.SCALE,
                Arrays.asList("1", "2", "3", "4", "5", "6", "7", "8", "9", "10"), false),
            new QuestionTemplate("consciousness_level", "Are you fully alert and oriented?", QuestionType.SINGLE_SELECT,
                Arrays.asList("Fully alert", "Slightly confused", "Very confused", "Drowsy", "Unconscious"), true)
        ));
    }
    
    @Transactional
    public SymptomQuestionnaire createQuestionnaire(User user, SymptomQuestionnaire.QuestionnaireType type, String title) {
        List<QuestionTemplate> template = QUESTIONNAIRE_TEMPLATES.get(type);
        if (template == null) {
            throw new IllegalArgumentException("Unknown questionnaire type: " + type);
        }
        
        SymptomQuestionnaire questionnaire = SymptomQuestionnaire.builder()
                .user(user)
                .title(title)
                .type(type)
                .status(SymptomQuestionnaire.QuestionnaireStatus.DRAFT)
                .currentStep(0)
                .totalSteps(template.size())
                .completionPercentage(0.0)
                .responses("{}")
                .build();
                
        return questionnaireRepository.save(questionnaire);
    }
    
    @Transactional
    public SymptomQuestionnaire startQuestionnaire(Long questionnaireId) {
        SymptomQuestionnaire questionnaire = questionnaireRepository.findById(questionnaireId)
                .orElseThrow(() -> new RuntimeException("Questionnaire not found"));
                
        questionnaire.setStatus(SymptomQuestionnaire.QuestionnaireStatus.IN_PROGRESS);
        questionnaire.setCurrentStep(1);
        
        return questionnaireRepository.save(questionnaire);
    }
    
    @Transactional
    public SymptomQuestionnaire submitResponse(Long questionnaireId, String questionId, Object response) {
        SymptomQuestionnaire questionnaire = questionnaireRepository.findById(questionnaireId)
                .orElseThrow(() -> new RuntimeException("Questionnaire not found"));
        
        try {
            // Parse existing responses
            @SuppressWarnings("unchecked")
            Map<String, Object> responses = objectMapper.readValue(questionnaire.getResponses(), Map.class);
            responses.put(questionId, response);
            
            // Update responses
            questionnaire.setResponses(objectMapper.writeValueAsString(responses));
            
            // Update progress
            List<QuestionTemplate> template = QUESTIONNAIRE_TEMPLATES.get(questionnaire.getType());
            int answeredQuestions = responses.size();
            double completionPercentage = (double) answeredQuestions / template.size() * 100;
            questionnaire.setCompletionPercentage(completionPercentage);
            
            // Check if questionnaire is complete
            if (answeredQuestions >= template.size()) {
                questionnaire.setStatus(SymptomQuestionnaire.QuestionnaireStatus.COMPLETED);
                questionnaire.setCompletedAt(LocalDateTime.now());
                
                // Perform analysis
                performAnalysis(questionnaire, responses);
            } else {
                questionnaire.setCurrentStep(answeredQuestions + 1);
            }
            
            return questionnaireRepository.save(questionnaire);
            
        } catch (JsonProcessingException e) {
            log.error("Error processing questionnaire responses", e);
            throw new RuntimeException("Error processing responses");
        }
    }
    
    private void performAnalysis(SymptomQuestionnaire questionnaire, Map<String, Object> responses) {
        try {
            // Generate AI analysis based on responses
            String analysisPrompt = buildAnalysisPrompt(questionnaire.getType(), responses);
            String aiAnalysis = geminiApiService.generateResponse(analysisPrompt, "SYMPTOM_ANALYSIS");
            
            // Determine risk level
            SymptomQuestionnaire.RiskLevel riskLevel = assessRiskLevel(questionnaire.getType(), responses);
            
            // Create analysis result
            Map<String, Object> analysisResult = new HashMap<>();
            analysisResult.put("aiAnalysis", aiAnalysis);
            analysisResult.put("riskLevel", riskLevel);
            analysisResult.put("recommendations", generateRecommendations(riskLevel, responses));
            analysisResult.put("urgentCare", requiresUrgentCare(responses));
            analysisResult.put("suggestedSpecialists", getSuggestedSpecialists(questionnaire.getType(), responses));
            
            questionnaire.setAnalysis_result(objectMapper.writeValueAsString(analysisResult));
            questionnaire.setRiskLevel(riskLevel);
            
        } catch (Exception e) {
            log.error("Error performing questionnaire analysis", e);
        }
    }
    
    private String buildAnalysisPrompt(SymptomQuestionnaire.QuestionnaireType type, Map<String, Object> responses) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Analyze the following symptom questionnaire responses for a ").append(type.name().toLowerCase()).append(" assessment:\n\n");
        
        for (Map.Entry<String, Object> entry : responses.entrySet()) {
            prompt.append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
        }
        
        prompt.append("\nProvide a comprehensive analysis including:\n");
        prompt.append("1. Possible conditions or diagnoses\n");
        prompt.append("2. Risk assessment\n");
        prompt.append("3. Recommended next steps\n");
        prompt.append("4. When to seek immediate medical attention\n");
        prompt.append("5. Self-care recommendations if appropriate\n");
        prompt.append("\nEmphasize the importance of professional medical evaluation for accurate diagnosis.");
        
        return prompt.toString();
    }
    
    private SymptomQuestionnaire.RiskLevel assessRiskLevel(SymptomQuestionnaire.QuestionnaireType type, Map<String, Object> responses) {
        // Emergency symptoms check
        if (type == SymptomQuestionnaire.QuestionnaireType.EMERGENCY_ASSESSMENT) {
            Object emergencySymptoms = responses.get("emergency_symptoms");
            if (emergencySymptoms != null && !emergencySymptoms.toString().contains("None")) {
                return SymptomQuestionnaire.RiskLevel.EMERGENCY;
            }
        }
        
        // Check for high-risk indicators
        Object severity = responses.get("symptom_severity");
        if (severity != null) {
            try {
                int severityScore = Integer.parseInt(severity.toString());
                if (severityScore >= 8) return SymptomQuestionnaire.RiskLevel.HIGH;
                if (severityScore >= 6) return SymptomQuestionnaire.RiskLevel.MODERATE;
                if (severityScore >= 4) return SymptomQuestionnaire.RiskLevel.LOW;
            } catch (NumberFormatException e) {
                // Handle non-numeric severity
            }
        }
        
        return SymptomQuestionnaire.RiskLevel.LOW;
    }
    
    private List<String> generateRecommendations(SymptomQuestionnaire.RiskLevel riskLevel, Map<String, Object> responses) {
        List<String> recommendations = new ArrayList<>();
        
        switch (riskLevel) {
            case EMERGENCY:
                recommendations.add("Seek immediate emergency medical attention");
                recommendations.add("Call emergency services (911) if symptoms are life-threatening");
                break;
            case VERY_HIGH:
            case HIGH:
                recommendations.add("Schedule urgent appointment with healthcare provider");
                recommendations.add("Consider urgent care or emergency room if symptoms worsen");
                break;
            case MODERATE:
                recommendations.add("Schedule appointment with healthcare provider within 24-48 hours");
                recommendations.add("Monitor symptoms closely");
                break;
            default:
                recommendations.add("Consider routine appointment if symptoms persist");
                recommendations.add("Practice appropriate self-care measures");
        }
        
        recommendations.add("Keep a symptom diary");
        recommendations.add("Stay hydrated and get adequate rest");
        
        return recommendations;
    }
    
    private boolean requiresUrgentCare(Map<String, Object> responses) {
        // Check for urgent care indicators
        Object emergencySymptoms = responses.get("emergency_symptoms");
        if (emergencySymptoms != null && !emergencySymptoms.toString().contains("None")) {
            return true;
        }
        
        Object severity = responses.get("symptom_severity");
        if (severity != null) {
            try {
                int severityScore = Integer.parseInt(severity.toString());
                return severityScore >= 7;
            } catch (NumberFormatException e) {
                return false;
            }
        }
        
        return false;
    }
    
    private List<String> getSuggestedSpecialists(SymptomQuestionnaire.QuestionnaireType type, Map<String, Object> responses) {
        List<String> specialists = new ArrayList<>();
        
        switch (type) {
            case CARDIOVASCULAR:
                specialists.add("Cardiologist");
                break;
            case RESPIRATORY:
                specialists.add("Pulmonologist");
                break;
            case NEUROLOGICAL:
                specialists.add("Neurologist");
                break;
            case GASTROINTESTINAL:
                specialists.add("Gastroenterologist");
                break;
            case MUSCULOSKELETAL:
                specialists.add("Orthopedist");
                specialists.add("Rheumatologist");
                break;
            case DERMATOLOGICAL:
                specialists.add("Dermatologist");
                break;
            case MENTAL_HEALTH:
                specialists.add("Psychiatrist");
                specialists.add("Psychologist");
                break;
            default:
                specialists.add("Primary Care Physician");
        }
        
        return specialists;
    }
    
    public List<SymptomQuestionnaire> getUserQuestionnaires(User user) {
        return questionnaireRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    public List<QuestionTemplate> getQuestionnaireTemplate(SymptomQuestionnaire.QuestionnaireType type) {
        return QUESTIONNAIRE_TEMPLATES.get(type);
    }
    
    public QuestionTemplate getCurrentQuestion(Long questionnaireId) {
        SymptomQuestionnaire questionnaire = questionnaireRepository.findById(questionnaireId)
                .orElseThrow(() -> new RuntimeException("Questionnaire not found"));
                
        List<QuestionTemplate> template = QUESTIONNAIRE_TEMPLATES.get(questionnaire.getType());
        int currentStep = questionnaire.getCurrentStep();
        
        if (currentStep > 0 && currentStep <= template.size()) {
            return template.get(currentStep - 1);
        }
        
        return null;
    }
    
    // Data classes
    public static class QuestionTemplate {
        private String id;
        private String question;
        private QuestionType type;
        private List<String> options;
        private boolean required;
        
        public QuestionTemplate(String id, String question, QuestionType type, List<String> options, boolean required) {
            this.id = id;
            this.question = question;
            this.type = type;
            this.options = options;
            this.required = required;
        }
        
        // Getters
        public String getId() { return id; }
        public String getQuestion() { return question; }
        public QuestionType getType() { return type; }
        public List<String> getOptions() { return options; }
        public boolean isRequired() { return required; }
    }
    
    public enum QuestionType {
        SINGLE_SELECT,
        MULTI_SELECT,
        TEXT,
        SCALE,
        YES_NO,
        DATE,
        NUMBER
    }
}
