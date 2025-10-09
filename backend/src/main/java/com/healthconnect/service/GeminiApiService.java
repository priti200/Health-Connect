package com.healthconnect.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiApiService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GeminiApiService.class);

    private final ObjectMapper objectMapper;

    public GeminiApiService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }
    
    @Value("${google.ai.api.key}")
    private String geminiApiKey;
    
    @Value("${google.ai.model:gemini-1.5-flash}")
    private String geminiModel;
    
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    
    public String generateResponse(String prompt, String conversationType) {
        try {
            // Check if API key is configured
            if (geminiApiKey == null || geminiApiKey.equals("YOUR_GEMINI_API_KEY")) {
                log.warn("Gemini API key not configured, using mock response");
                return getMockResponse(prompt, conversationType);
            }

            log.debug("Making Gemini API call with model: {} and API key: {}...", geminiModel, geminiApiKey.substring(0, 10) + "***");
            
            WebClient webClient = WebClient.builder()
                    .baseUrl(GEMINI_API_URL)
                    .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                    .build();
            
            // Build the enhanced prompt based on conversation type
            String enhancedPrompt = buildEnhancedPrompt(prompt, conversationType);
            
            GeminiRequest request = new GeminiRequest();
            request.setContents(List.of(new Content(List.of(new Part(enhancedPrompt)))));
            
            // Configure generation settings for medical responses
            GenerationConfig config = new GenerationConfig();
            config.setTemperature(0.7);
            config.setTopK(40);
            config.setTopP(0.95);
            config.setMaxOutputTokens(1024);
            
            request.setGenerationConfig(config);
            
            // Add safety settings for medical content
            SafetySetting[] safetySettings = {
                new SafetySetting("HARM_CATEGORY_HARASSMENT", "BLOCK_MEDIUM_AND_ABOVE"),
                new SafetySetting("HARM_CATEGORY_HATE_SPEECH", "BLOCK_MEDIUM_AND_ABOVE"),
                new SafetySetting("HARM_CATEGORY_SEXUALLY_EXPLICIT", "BLOCK_MEDIUM_AND_ABOVE"),
                new SafetySetting("HARM_CATEGORY_DANGEROUS_CONTENT", "BLOCK_MEDIUM_AND_ABOVE")
            };
            request.setSafetySettings(List.of(safetySettings));
            
            String response = webClient
                    .post()
                    .uri(uriBuilder -> uriBuilder
                        .path(geminiModel + ":generateContent")
                        .queryParam("key", geminiApiKey)
                        .build())
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();
            
            return parseGeminiResponse(response);
            
        } catch (Exception e) {
            log.error("Error calling Gemini API: {}", e.getMessage());
            return getMockResponse(prompt, conversationType);
        }
    }
    
    private String buildEnhancedPrompt(String userMessage, String conversationType) {
        StringBuilder promptBuilder = new StringBuilder();
        
        // Base medical assistant context
        promptBuilder.append("You are HealthConnect AI, a knowledgeable and empathetic medical assistant. ");
        promptBuilder.append("Provide helpful, accurate health information while being responsible and ethical. ");
        promptBuilder.append("Always remind users to consult healthcare professionals for serious concerns. ");
        promptBuilder.append("Be supportive but never provide definitive diagnoses or replace professional medical advice.\n\n");
        
        // Add conversation type specific context
        switch (conversationType.toUpperCase()) {
            case "SYMPTOM_ANALYSIS":
                promptBuilder.append("CONTEXT: The user is asking about symptoms. Provide general information about possible causes, ");
                promptBuilder.append("when to seek medical attention, and self-care measures. Always emphasize the importance of professional evaluation.\n\n");
                break;
                
            case "MEDICATION_INQUIRY":
                promptBuilder.append("CONTEXT: The user is asking about medications. Provide general information about medications, ");
                promptBuilder.append("potential interactions, and side effects. Always emphasize consulting with healthcare providers or pharmacists.\n\n");
                break;
                
            case "WELLNESS_TIPS":
                promptBuilder.append("CONTEXT: The user is seeking wellness and lifestyle advice. Provide evidence-based health tips, ");
                promptBuilder.append("preventive measures, and healthy lifestyle recommendations.\n\n");
                break;
                
            case "EMERGENCY_GUIDANCE":
                promptBuilder.append("CONTEXT: This may be an urgent health concern. Prioritize safety, provide clear guidance on when to seek immediate care, ");
                promptBuilder.append("and include emergency contact information. Be direct and helpful.\n\n");
                break;
                
            default:
                promptBuilder.append("CONTEXT: General health inquiry. Provide helpful health information and guidance.\n\n");
        }
        
        promptBuilder.append("USER QUESTION: ").append(userMessage).append("\n\n");
        promptBuilder.append("Please provide a helpful, empathetic response:");
        
        return promptBuilder.toString();
    }
    
    private String parseGeminiResponse(String response) {
        try {
            Map<String, Object> responseMap = objectMapper.readValue(response, Map.class);
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
            
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                if (content != null) {
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
            
            log.warn("Unexpected Gemini API response format");
            return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
            
        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage());
            return "I apologize, but I'm experiencing technical difficulties. Please try again later.";
        }
    }
    
    private String getMockResponse(String userMessage, String conversationType) {
        // Enhanced mock responses for when Gemini API is not available
        switch (conversationType.toUpperCase()) {
            case "SYMPTOM_ANALYSIS":
                return "I understand you're concerned about your symptoms. While I can provide general information, it's important to consult with a healthcare professional for proper evaluation and diagnosis. " +
                       "Common causes of symptoms can vary widely, and a medical professional can assess your specific situation, medical history, and provide appropriate guidance. " +
                       "If symptoms are severe, persistent, or concerning, please don't hesitate to contact your healthcare provider or seek medical attention.";
                
            case "MEDICATION_INQUIRY":
                return "Thank you for your medication question. For specific information about medications, interactions, dosages, or side effects, I strongly recommend consulting with your healthcare provider or pharmacist. " +
                       "They have access to your complete medical history and can provide personalized advice. Never stop, start, or change medications without professional guidance. " +
                       "If you have urgent concerns about a medication, contact your healthcare provider immediately.";
                
            case "WELLNESS_TIPS":
                return "Here are some evidence-based wellness recommendations: maintain a balanced diet rich in fruits, vegetables, and whole grains; stay adequately hydrated; " +
                       "engage in regular physical activity appropriate for your fitness level; prioritize quality sleep (7-9 hours for most adults); manage stress through relaxation techniques; " +
                       "and maintain social connections. Remember, individual needs vary, so consider discussing any significant lifestyle changes with your healthcare provider.";
                
            case "EMERGENCY_GUIDANCE":
                return "⚠️ IMPORTANT: If this is a medical emergency, please call emergency services immediately (911 in the US, or your local emergency number). " +
                       "For urgent but non-emergency situations, contact your healthcare provider, visit an urgent care center, or go to the emergency room. " +
                       "Signs that require immediate medical attention include: chest pain, difficulty breathing, severe bleeding, loss of consciousness, severe allergic reactions, " +
                       "or any situation where you feel your life or health is in immediate danger. When in doubt, seek professional medical help immediately.";
                
            default:
                return "Thank you for reaching out to HealthConnect AI. I'm here to provide general health information and support. " +
                       "While I strive to be helpful, please remember that I cannot replace professional medical advice, diagnosis, or treatment. " +
                       "For specific health concerns, always consult with qualified healthcare professionals who can evaluate your individual situation and provide personalized care.";
        }
    }
    
    // Data classes for Gemini API
    @Data
    public static class GeminiRequest {
        private List<Content> contents;
        private GenerationConfig generationConfig;
        private List<SafetySetting> safetySettings;

        // Getters and setters
        public List<Content> getContents() { return contents; }
        public void setContents(List<Content> contents) { this.contents = contents; }

        public GenerationConfig getGenerationConfig() { return generationConfig; }
        public void setGenerationConfig(GenerationConfig generationConfig) { this.generationConfig = generationConfig; }

        public List<SafetySetting> getSafetySettings() { return safetySettings; }
        public void setSafetySettings(List<SafetySetting> safetySettings) { this.safetySettings = safetySettings; }
    }
    
    @Data
    public static class Content {
        private List<Part> parts;
        
        public Content(List<Part> parts) {
            this.parts = parts;
        }
    }
    
    @Data
    public static class Part {
        private String text;
        
        public Part(String text) {
            this.text = text;
        }
    }
    
    @Data
    public static class GenerationConfig {
        private Double temperature;
        private Integer topK;
        private Double topP;
        private Integer maxOutputTokens;

        // Getters and setters
        public Double getTemperature() { return temperature; }
        public void setTemperature(Double temperature) { this.temperature = temperature; }

        public Integer getTopK() { return topK; }
        public void setTopK(Integer topK) { this.topK = topK; }

        public Double getTopP() { return topP; }
        public void setTopP(Double topP) { this.topP = topP; }

        public Integer getMaxOutputTokens() { return maxOutputTokens; }
        public void setMaxOutputTokens(Integer maxOutputTokens) { this.maxOutputTokens = maxOutputTokens; }
    }
    
    @Data
    public static class SafetySetting {
        private String category;
        @JsonProperty("threshold")
        private String threshold;
        
        public SafetySetting(String category, String threshold) {
            this.category = category;
            this.threshold = threshold;
        }
    }
}
