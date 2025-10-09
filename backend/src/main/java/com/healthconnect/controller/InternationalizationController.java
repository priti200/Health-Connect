package com.healthconnect.controller;

import com.healthconnect.service.InternationalizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/i18n")
@RequiredArgsConstructor
@Slf4j
public class InternationalizationController {
    
    private final InternationalizationService i18nService;
    
    @GetMapping("/languages")
    public ResponseEntity<?> getSupportedLanguages() {
        try {
            List<String> languages = i18nService.getSupportedLanguages();
            Map<String, String> languageInfo = i18nService.getLanguageInfo();
            
            return ResponseEntity.ok(Map.of(
                "languages", languages,
                "languageInfo", languageInfo
            ));
        } catch (Exception e) {
            log.error("Error getting supported languages", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/translations/{languageCode}")
    public ResponseEntity<?> getTranslations(@PathVariable String languageCode) {
        try {
            Map<String, String> translations = i18nService.getTranslations(languageCode);
            
            return ResponseEntity.ok(Map.of(
                "language", languageCode,
                "translations", translations,
                "count", translations.size()
            ));
        } catch (Exception e) {
            log.error("Error getting translations for language: {}", languageCode, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/translate")
    public ResponseEntity<?> translate(@RequestBody Map<String, Object> request) {
        try {
            String key = (String) request.get("key");
            String languageCode = (String) request.get("language");
            @SuppressWarnings("unchecked")
            Map<String, String> parameters = (Map<String, String>) request.get("parameters");
            
            if (key == null || languageCode == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Key and language are required"
                ));
            }
            
            String translation = i18nService.translate(key, languageCode, parameters);
            
            return ResponseEntity.ok(Map.of(
                "key", key,
                "language", languageCode,
                "translation", translation,
                "parameters", parameters != null ? parameters : Map.of()
            ));
        } catch (Exception e) {
            log.error("Error translating", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/translate/batch")
    public ResponseEntity<?> translateBatch(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> keys = (List<String>) request.get("keys");
            String languageCode = (String) request.get("language");
            
            if (keys == null || languageCode == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Keys and language are required"
                ));
            }
            
            Map<String, String> translations = new java.util.HashMap<>();
            for (String key : keys) {
                translations.put(key, i18nService.translate(key, languageCode));
            }
            
            return ResponseEntity.ok(Map.of(
                "language", languageCode,
                "translations", translations,
                "count", translations.size()
            ));
        } catch (Exception e) {
            log.error("Error translating batch", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/detect-language")
    public ResponseEntity<?> detectLanguage(@RequestBody Map<String, String> request) {
        try {
            String text = request.get("text");
            
            if (text == null || text.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Text is required"
                ));
            }
            
            String detectedLanguage = i18nService.detectLanguage(text);
            Map<String, String> languageInfo = i18nService.getLanguageInfo();
            
            return ResponseEntity.ok(Map.of(
                "text", text,
                "detectedLanguage", detectedLanguage,
                "languageName", languageInfo.get(detectedLanguage),
                "confidence", 0.85 // Mock confidence score
            ));
        } catch (Exception e) {
            log.error("Error detecting language", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/format-message")
    public ResponseEntity<?> formatMessage(@RequestBody Map<String, Object> request) {
        try {
            String messageKey = (String) request.get("messageKey");
            String languageCode = (String) request.get("language");
            @SuppressWarnings("unchecked")
            List<Object> parameters = (List<Object>) request.get("parameters");
            
            if (messageKey == null || languageCode == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Message key and language are required"
                ));
            }
            
            Object[] paramArray = parameters != null ? parameters.toArray() : new Object[0];
            String formattedMessage = i18nService.formatMessage(messageKey, languageCode, paramArray);
            
            return ResponseEntity.ok(Map.of(
                "messageKey", messageKey,
                "language", languageCode,
                "formattedMessage", formattedMessage,
                "parameters", parameters != null ? parameters : List.of()
            ));
        } catch (Exception e) {
            log.error("Error formatting message", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        try {
            List<String> supportedLanguages = i18nService.getSupportedLanguages();
            
            return ResponseEntity.ok(Map.of(
                "status", "healthy",
                "service", "InternationalizationService",
                "timestamp", System.currentTimeMillis(),
                "supportedLanguages", supportedLanguages,
                "languageCount", supportedLanguages.size()
            ));
        } catch (Exception e) {
            log.error("Error in health check", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
