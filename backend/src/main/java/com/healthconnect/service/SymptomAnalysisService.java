package com.healthconnect.service;

import com.healthconnect.entity.AiConversation;
import com.healthconnect.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SymptomAnalysisService {
    
    private final GeminiApiService geminiApiService;
    
    // Medical knowledge base for symptom analysis
    private static final Map<String, SymptomInfo> SYMPTOM_DATABASE = new HashMap<>();
    
    static {
        // Common symptoms and their information
        SYMPTOM_DATABASE.put("headache", new SymptomInfo("Headache", 
            Arrays.asList("tension", "migraine", "cluster", "sinus", "dehydration"),
            Arrays.asList("stress", "dehydration", "lack of sleep", "eye strain", "medication overuse"),
            "Seek immediate care if sudden severe headache, fever with headache, or neurological symptoms"));
            
        SYMPTOM_DATABASE.put("fever", new SymptomInfo("Fever", 
            Arrays.asList("viral infection", "bacterial infection", "inflammatory condition"),
            Arrays.asList("infection", "inflammation", "medication reaction", "heat exhaustion"),
            "Seek care if fever >103°F (39.4°C), persistent fever >3 days, or with severe symptoms"));
            
        SYMPTOM_DATABASE.put("cough", new SymptomInfo("Cough", 
            Arrays.asList("viral infection", "allergies", "asthma", "GERD", "medication side effect"),
            Arrays.asList("respiratory infection", "allergies", "irritants", "acid reflux"),
            "Seek care if coughing blood, persistent cough >3 weeks, or difficulty breathing"));
            
        SYMPTOM_DATABASE.put("chest pain", new SymptomInfo("Chest Pain", 
            Arrays.asList("heart condition", "lung condition", "muscle strain", "anxiety"),
            Arrays.asList("cardiac issues", "pulmonary problems", "musculoskeletal", "gastrointestinal"),
            "EMERGENCY: Seek immediate care for chest pain, especially with shortness of breath"));
            
        SYMPTOM_DATABASE.put("shortness of breath", new SymptomInfo("Shortness of Breath", 
            Arrays.asList("asthma", "heart condition", "lung infection", "anxiety"),
            Arrays.asList("respiratory conditions", "cardiac issues", "anemia", "anxiety"),
            "EMERGENCY: Seek immediate care for severe breathing difficulty"));
    }
    
    public SymptomAnalysisResult analyzeSymptoms(String symptoms, User user, AiConversation conversation) {
        try {
            log.info("Analyzing symptoms for user: {}", user.getEmail());
            
            // Extract key symptoms from the input
            List<String> detectedSymptoms = extractSymptoms(symptoms);
            
            // Get severity assessment
            SeverityLevel severity = assessSeverity(symptoms, detectedSymptoms);
            
            // Generate AI-powered analysis
            String aiAnalysis = generateAiAnalysis(symptoms, detectedSymptoms, severity);
            
            // Get recommendations
            List<String> recommendations = generateRecommendations(detectedSymptoms, severity);
            
            // Determine urgency
            UrgencyLevel urgency = determineUrgency(detectedSymptoms, severity);
            
            return SymptomAnalysisResult.builder()
                    .detectedSymptoms(detectedSymptoms)
                    .severity(severity)
                    .urgency(urgency)
                    .aiAnalysis(aiAnalysis)
                    .recommendations(recommendations)
                    .warningFlags(getWarningFlags(detectedSymptoms))
                    .suggestedSpecialists(getSuggestedSpecialists(detectedSymptoms))
                    .followUpAdvice(getFollowUpAdvice(severity, urgency))
                    .build();
                    
        } catch (Exception e) {
            log.error("Error analyzing symptoms: {}", e.getMessage());
            return createErrorResponse();
        }
    }
    
    private List<String> extractSymptoms(String input) {
        String lowerInput = input.toLowerCase();
        return SYMPTOM_DATABASE.keySet().stream()
                .filter(symptom -> lowerInput.contains(symptom))
                .collect(Collectors.toList());
    }
    
    private SeverityLevel assessSeverity(String input, List<String> symptoms) {
        String lowerInput = input.toLowerCase();
        
        // High severity indicators
        if (lowerInput.contains("severe") || lowerInput.contains("intense") || 
            lowerInput.contains("unbearable") || lowerInput.contains("emergency") ||
            symptoms.contains("chest pain") || symptoms.contains("shortness of breath")) {
            return SeverityLevel.HIGH;
        }
        
        // Medium severity indicators
        if (lowerInput.contains("moderate") || lowerInput.contains("persistent") ||
            lowerInput.contains("worsening") || symptoms.size() > 2) {
            return SeverityLevel.MEDIUM;
        }
        
        return SeverityLevel.LOW;
    }
    
    private String generateAiAnalysis(String symptoms, List<String> detectedSymptoms, SeverityLevel severity) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Provide a comprehensive medical analysis for the following symptoms: ");
        prompt.append(symptoms);
        prompt.append("\n\nDetected key symptoms: ").append(String.join(", ", detectedSymptoms));
        prompt.append("\nSeverity level: ").append(severity);
        prompt.append("\n\nPlease provide:\n");
        prompt.append("1. Possible causes and conditions\n");
        prompt.append("2. Risk factors to consider\n");
        prompt.append("3. When to seek medical attention\n");
        prompt.append("4. General self-care measures (if appropriate)\n");
        prompt.append("\nRemember to emphasize the importance of professional medical evaluation.");
        
        return geminiApiService.generateResponse(prompt.toString(), "SYMPTOM_ANALYSIS");
    }
    
    private List<String> generateRecommendations(List<String> symptoms, SeverityLevel severity) {
        List<String> recommendations = new ArrayList<>();
        
        if (severity == SeverityLevel.HIGH) {
            recommendations.add("Seek immediate medical attention");
            recommendations.add("Consider emergency room visit if symptoms worsen");
        } else if (severity == SeverityLevel.MEDIUM) {
            recommendations.add("Schedule appointment with healthcare provider within 24-48 hours");
            recommendations.add("Monitor symptoms closely");
        } else {
            recommendations.add("Consider scheduling routine appointment if symptoms persist");
            recommendations.add("Try appropriate self-care measures");
        }
        
        // Add symptom-specific recommendations
        for (String symptom : symptoms) {
            SymptomInfo info = SYMPTOM_DATABASE.get(symptom);
            if (info != null && info.getUrgencyAdvice() != null) {
                recommendations.add(info.getUrgencyAdvice());
            }
        }
        
        recommendations.add("Stay hydrated and get adequate rest");
        recommendations.add("Keep a symptom diary to track changes");
        
        return recommendations.stream().distinct().collect(Collectors.toList());
    }
    
    private UrgencyLevel determineUrgency(List<String> symptoms, SeverityLevel severity) {
        // Emergency symptoms
        if (symptoms.contains("chest pain") || symptoms.contains("shortness of breath")) {
            return UrgencyLevel.EMERGENCY;
        }
        
        if (severity == SeverityLevel.HIGH) {
            return UrgencyLevel.URGENT;
        } else if (severity == SeverityLevel.MEDIUM) {
            return UrgencyLevel.MODERATE;
        }
        
        return UrgencyLevel.LOW;
    }
    
    private List<String> getWarningFlags(List<String> symptoms) {
        List<String> warnings = new ArrayList<>();
        
        if (symptoms.contains("chest pain")) {
            warnings.add("⚠️ Chest pain can indicate serious cardiac conditions");
        }
        if (symptoms.contains("shortness of breath")) {
            warnings.add("⚠️ Breathing difficulties require prompt evaluation");
        }
        if (symptoms.contains("fever") && symptoms.size() > 1) {
            warnings.add("⚠️ Fever with multiple symptoms may indicate infection");
        }
        
        return warnings;
    }
    
    private List<String> getSuggestedSpecialists(List<String> symptoms) {
        Set<String> specialists = new HashSet<>();
        
        if (symptoms.contains("chest pain") || symptoms.contains("shortness of breath")) {
            specialists.add("Cardiologist");
            specialists.add("Pulmonologist");
        }
        if (symptoms.contains("headache")) {
            specialists.add("Neurologist");
        }
        if (symptoms.contains("cough")) {
            specialists.add("Pulmonologist");
        }
        
        return new ArrayList<>(specialists);
    }
    
    private String getFollowUpAdvice(SeverityLevel severity, UrgencyLevel urgency) {
        if (urgency == UrgencyLevel.EMERGENCY) {
            return "Call emergency services (911) immediately or go to the nearest emergency room.";
        } else if (urgency == UrgencyLevel.URGENT) {
            return "Contact your healthcare provider immediately or visit urgent care.";
        } else if (severity == SeverityLevel.MEDIUM) {
            return "Schedule an appointment with your healthcare provider within 1-2 days.";
        }
        return "Monitor symptoms and consult healthcare provider if they persist or worsen.";
    }
    
    private SymptomAnalysisResult createErrorResponse() {
        return SymptomAnalysisResult.builder()
                .detectedSymptoms(Arrays.asList("analysis_error"))
                .severity(SeverityLevel.MEDIUM)
                .urgency(UrgencyLevel.MODERATE)
                .aiAnalysis("I apologize, but I'm having trouble analyzing your symptoms right now. Please consult with a healthcare professional for proper evaluation.")
                .recommendations(Arrays.asList("Consult healthcare provider", "Seek medical attention if symptoms worsen"))
                .warningFlags(Arrays.asList("⚠️ Unable to complete analysis - seek professional medical advice"))
                .suggestedSpecialists(Arrays.asList("Primary Care Physician"))
                .followUpAdvice("Please consult with a healthcare professional for proper symptom evaluation.")
                .build();
    }
    
    // Data classes
    @Data
    @AllArgsConstructor
    public static class SymptomInfo {
        private final String name;
        private final List<String> commonTypes;
        private final List<String> possibleCauses;
        private final String urgencyAdvice;
    }
    
    @Data
    public static class SymptomAnalysisResult {
        private List<String> detectedSymptoms;
        private SeverityLevel severity;
        private UrgencyLevel urgency;
        private String aiAnalysis;
        private List<String> recommendations;
        private List<String> warningFlags;
        private List<String> suggestedSpecialists;
        private String followUpAdvice;
        
        public static SymptomAnalysisResultBuilder builder() {
            return new SymptomAnalysisResultBuilder();
        }
    }
    
    public static class SymptomAnalysisResultBuilder {
        private SymptomAnalysisResult result = new SymptomAnalysisResult();
        
        public SymptomAnalysisResultBuilder detectedSymptoms(List<String> symptoms) {
            result.setDetectedSymptoms(symptoms);
            return this;
        }
        
        public SymptomAnalysisResultBuilder severity(SeverityLevel severity) {
            result.setSeverity(severity);
            return this;
        }
        
        public SymptomAnalysisResultBuilder urgency(UrgencyLevel urgency) {
            result.setUrgency(urgency);
            return this;
        }
        
        public SymptomAnalysisResultBuilder aiAnalysis(String analysis) {
            result.setAiAnalysis(analysis);
            return this;
        }
        
        public SymptomAnalysisResultBuilder recommendations(List<String> recommendations) {
            result.setRecommendations(recommendations);
            return this;
        }
        
        public SymptomAnalysisResultBuilder warningFlags(List<String> warnings) {
            result.setWarningFlags(warnings);
            return this;
        }
        
        public SymptomAnalysisResultBuilder suggestedSpecialists(List<String> specialists) {
            result.setSuggestedSpecialists(specialists);
            return this;
        }
        
        public SymptomAnalysisResultBuilder followUpAdvice(String advice) {
            result.setFollowUpAdvice(advice);
            return this;
        }
        
        public SymptomAnalysisResult build() {
            return result;
        }
    }
    
    public enum SeverityLevel {
        LOW, MEDIUM, HIGH
    }
    
    public enum UrgencyLevel {
        LOW, MODERATE, URGENT, EMERGENCY
    }
}
