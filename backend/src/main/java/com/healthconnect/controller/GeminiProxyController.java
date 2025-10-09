package com.healthconnect.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

import java.util.Map;

@RestController
@RequestMapping("/api/gemini")
@RequiredArgsConstructor
@Slf4j
public class GeminiProxyController {

    private static final String GEMINI_API_URL = "https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant";
    
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzePrescrition(@RequestBody Map<String, Object> request) {
        log.info("Received prescription analysis request");

        try {
            // Validate request - require image_base64 for prescription analysis
            if (!request.containsKey("image_base64")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing required field: image_base64 for prescription analysis"));
            }

            String imageBase64 = (String) request.get("image_base64");
            if (imageBase64 == null || imageBase64.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "image_base64 cannot be empty"));
            }
            // Create RestTemplate for external API call
            RestTemplate restTemplate = new RestTemplate();
            
            // Set headers for the external API call
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create HTTP entity with request body and headers
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            log.info("Calling Gemini Medical Assistant API...");
            
            // Make the API call to Gemini
            ResponseEntity<String> response = restTemplate.exchange(
                GEMINI_API_URL,
                HttpMethod.POST,
                entity,
                String.class
            );
            
            log.info("Gemini API call successful, status: {}", response.getStatusCode());
            
            // Return the response from Gemini API
            return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(response.getBody());
                
        } catch (HttpClientErrorException e) {
            log.error("Gemini API client error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode())
                .body("Gemini API error: " + e.getResponseBodyAsString());
                
        } catch (HttpServerErrorException e) {
            log.error("Gemini API server error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("Gemini AI service temporarily unavailable. Please try again.");
                
        } catch (Exception e) {
            log.error("Unexpected error calling Gemini API", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to analyze prescription. Please try again.");
        }
    }

    @PostMapping("/query")
    public ResponseEntity<?> queryGemini(@RequestBody Map<String, Object> request) {
        log.info("Received text query request");

        try {
            // Validate request - require message for text queries
            if (!request.containsKey("message")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing required field: message"));
            }

            String message = (String) request.get("message");
            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "message cannot be empty"));
            }

            // Create RestTemplate for external API call
            RestTemplate restTemplate = new RestTemplate();

            // Set headers for the external API call
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "HealthConnect-Backend/1.0");

            // Create HTTP entity with request body and headers
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            log.info("Calling Gemini Medical Assistant API for text query...");

            // Make the API call to Gemini
            ResponseEntity<String> response = restTemplate.exchange(
                GEMINI_API_URL,
                HttpMethod.POST,
                entity,
                String.class
            );

            log.info("Gemini API call successful, status: {}", response.getStatusCode());

            // Return the response from Gemini API
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response.getBody());

        } catch (HttpClientErrorException e) {
            log.error("Gemini API client error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode())
                .body(Map.of("error", "Gemini API error: " + e.getResponseBodyAsString()));

        } catch (HttpServerErrorException e) {
            log.error("Gemini API server error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Gemini AI service temporarily unavailable. Please try again."));

        } catch (Exception e) {
            log.error("Unexpected error calling Gemini API", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to process query. Please try again."));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Gemini Proxy",
            "geminiApiUrl", GEMINI_API_URL,
            "timestamp", System.currentTimeMillis()
        ));
    }
}
