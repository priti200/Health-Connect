package com.healthconnect.controller;

import com.healthconnect.entity.SymptomQuestionnaire;
import com.healthconnect.entity.User;
import com.healthconnect.service.SymptomQuestionnaireService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/symptom-questionnaire")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class SymptomQuestionnaireController {
    
    private final SymptomQuestionnaireService questionnaireService;
    
    @PostMapping("/create")
    public ResponseEntity<?> createQuestionnaire(
            @RequestBody CreateQuestionnaireRequest request,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        log.info("Creating questionnaire for user: {}", currentUser.getEmail());
        
        try {
            SymptomQuestionnaire questionnaire = questionnaireService.createQuestionnaire(
                currentUser, 
                request.getType(), 
                request.getTitle()
            );
            
            return ResponseEntity.ok(questionnaire);
        } catch (Exception e) {
            log.error("Error creating questionnaire: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error creating questionnaire: " + e.getMessage());
        }
    }
    
    @PostMapping("/{id}/start")
    public ResponseEntity<?> startQuestionnaire(
            @PathVariable Long id,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        log.info("Starting questionnaire {} for user: {}", id, currentUser.getEmail());
        
        try {
            SymptomQuestionnaire questionnaire = questionnaireService.startQuestionnaire(id);
            return ResponseEntity.ok(questionnaire);
        } catch (Exception e) {
            log.error("Error starting questionnaire: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error starting questionnaire: " + e.getMessage());
        }
    }
    
    @PostMapping("/{id}/respond")
    public ResponseEntity<?> submitResponse(
            @PathVariable Long id,
            @RequestBody QuestionnaireResponse response,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        log.info("Submitting response for questionnaire {} from user: {}", id, currentUser.getEmail());
        
        try {
            SymptomQuestionnaire questionnaire = questionnaireService.submitResponse(
                id, 
                response.getQuestionId(), 
                response.getAnswer()
            );
            
            return ResponseEntity.ok(questionnaire);
        } catch (Exception e) {
            log.error("Error submitting response: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error submitting response: " + e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getQuestionnaire(
            @PathVariable Long id,
            Authentication authentication) {
        
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            // In a real implementation, you'd check if the user owns this questionnaire
            SymptomQuestionnaire questionnaire = questionnaireService.getUserQuestionnaires(currentUser)
                .stream()
                .filter(q -> q.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Questionnaire not found"));
                
            return ResponseEntity.ok(questionnaire);
        } catch (Exception e) {
            log.error("Error retrieving questionnaire: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error retrieving questionnaire: " + e.getMessage());
        }
    }
    
    @GetMapping("/{id}/current-question")
    public ResponseEntity<?> getCurrentQuestion(
            @PathVariable Long id,
            Authentication authentication) {
        
        try {
            SymptomQuestionnaireService.QuestionTemplate question = questionnaireService.getCurrentQuestion(id);
            if (question == null) {
                return ResponseEntity.badRequest().body("No current question available");
            }
            
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            log.error("Error getting current question: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error getting current question: " + e.getMessage());
        }
    }
    
    @GetMapping("/my-questionnaires")
    public ResponseEntity<?> getUserQuestionnaires(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        
        try {
            List<SymptomQuestionnaire> questionnaires = questionnaireService.getUserQuestionnaires(currentUser);
            return ResponseEntity.ok(questionnaires);
        } catch (Exception e) {
            log.error("Error retrieving user questionnaires: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error retrieving questionnaires: " + e.getMessage());
        }
    }
    
    @GetMapping("/templates")
    public ResponseEntity<?> getQuestionnaireTemplates() {
        try {
            Map<String, Object> templates = Map.of(
                "GENERAL_SYMPTOMS", questionnaireService.getQuestionnaireTemplate(SymptomQuestionnaire.QuestionnaireType.GENERAL_SYMPTOMS),
                "CARDIOVASCULAR", questionnaireService.getQuestionnaireTemplate(SymptomQuestionnaire.QuestionnaireType.CARDIOVASCULAR),
                "RESPIRATORY", questionnaireService.getQuestionnaireTemplate(SymptomQuestionnaire.QuestionnaireType.RESPIRATORY),
                "NEUROLOGICAL", questionnaireService.getQuestionnaireTemplate(SymptomQuestionnaire.QuestionnaireType.NEUROLOGICAL),
                "GASTROINTESTINAL", questionnaireService.getQuestionnaireTemplate(SymptomQuestionnaire.QuestionnaireType.GASTROINTESTINAL),
                "MUSCULOSKELETAL", questionnaireService.getQuestionnaireTemplate(SymptomQuestionnaire.QuestionnaireType.MUSCULOSKELETAL),
                "DERMATOLOGICAL", questionnaireService.getQuestionnaireTemplate(SymptomQuestionnaire.QuestionnaireType.DERMATOLOGICAL),
                "MENTAL_HEALTH", questionnaireService.getQuestionnaireTemplate(SymptomQuestionnaire.QuestionnaireType.MENTAL_HEALTH),
                "EMERGENCY_ASSESSMENT", questionnaireService.getQuestionnaireTemplate(SymptomQuestionnaire.QuestionnaireType.EMERGENCY_ASSESSMENT)
            );
            
            return ResponseEntity.ok(templates);
        } catch (Exception e) {
            log.error("Error retrieving questionnaire templates: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error retrieving templates: " + e.getMessage());
        }
    }
    
    @GetMapping("/types")
    public ResponseEntity<?> getQuestionnaireTypes() {
        try {
            List<Map<String, Object>> types = List.of(
                Map.of("value", "GENERAL_SYMPTOMS", "label", "General Symptoms", "description", "Comprehensive symptom assessment"),
                Map.of("value", "CARDIOVASCULAR", "label", "Heart & Circulation", "description", "Heart and cardiovascular symptoms"),
                Map.of("value", "RESPIRATORY", "label", "Breathing & Lungs", "description", "Respiratory and lung symptoms"),
                Map.of("value", "NEUROLOGICAL", "label", "Brain & Nervous System", "description", "Neurological symptoms"),
                Map.of("value", "GASTROINTESTINAL", "label", "Digestive System", "description", "Stomach and digestive symptoms"),
                Map.of("value", "MUSCULOSKELETAL", "label", "Muscles & Bones", "description", "Muscle, bone, and joint symptoms"),
                Map.of("value", "DERMATOLOGICAL", "label", "Skin & Hair", "description", "Skin and dermatological symptoms"),
                Map.of("value", "MENTAL_HEALTH", "label", "Mental Health", "description", "Mental health and mood symptoms"),
                Map.of("value", "EMERGENCY_ASSESSMENT", "label", "Emergency Assessment", "description", "Urgent symptom evaluation")
            );
            
            return ResponseEntity.ok(types);
        } catch (Exception e) {
            log.error("Error retrieving questionnaire types: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error retrieving types: " + e.getMessage());
        }
    }
    
    // Request/Response DTOs
    public static class CreateQuestionnaireRequest {
        private SymptomQuestionnaire.QuestionnaireType type;
        private String title;
        
        // Getters and setters
        public SymptomQuestionnaire.QuestionnaireType getType() { return type; }
        public void setType(SymptomQuestionnaire.QuestionnaireType type) { this.type = type; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
    }
    
    public static class QuestionnaireResponse {
        private String questionId;
        private Object answer;
        
        // Getters and setters
        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }
        public Object getAnswer() { return answer; }
        public void setAnswer(Object answer) { this.answer = answer; }
    }
}
