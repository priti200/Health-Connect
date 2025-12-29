package com.healthconnect.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/gemini")
@RequiredArgsConstructor
@Slf4j
public class GeminiProxyController {

    @Value("${google.ai.api.key}")
    private String apiKey;

    @Value("${google.ai.model:gemini-1.5-flash}")
    private String model;

    private static final String GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzePrescription(@RequestBody Map<String, Object> request) {
        log.info("Received prescription analysis request");

        try {
            // Validate request
            if (!request.containsKey("image_base64")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing required field: image_base64"));
            }

            String imageBase64 = (String) request.get("image_base64");
            if (imageBase64 == null || imageBase64.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "image_base64 cannot be empty"));
            }

            // Construct successful prompt to match frontend parser expectations
            String promptText = "Analyze this prescription image. For each medicine found, format the output exactly as follows:\n" +
                    "**Medicine Name**\n" +
                    "✅ Purpose: [Purpose]\n" +
                    "➕ Pros: [Pros]\n" +
                    "⚠️ Cons: [Cons]\n" +
                    "Low-cost alternative: [Name] – [Price]\n" +
                    "High-cost branded alternative: [Name] – [Price]\n" +
                    "Buy: [Link if available]\n\n" +
                    "After listing all medicines, provide a section starting with '🧠 Possible illness' describing what condition this might be for.";

            // Build Google Gemini Request
            Map<String, Object> geminiRequest = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();

            // Text Part (Prompt)
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", promptText);
            parts.add(textPart);

            // Image Part
            Map<String, Object> imagePart = new HashMap<>();
            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mime_type", "image/jpeg"); // Assuming jpeg, API is usually flexible
            inlineData.put("data", imageBase64);
            imagePart.put("inline_data", inlineData);
            parts.add(imagePart);

            content.put("parts", parts);
            contents.add(content);
            geminiRequest.put("contents", contents);

            // Make API Call
            String apiUrl = GEMINI_API_BASE + model + ":generateContent?key=" + apiKey;
            
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(geminiRequest, headers);

            log.info("Calling Google Gemini API: {}", GEMINI_API_BASE + model);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                entity,
                Map.class
            );

            // Parse Response to return simple text to frontend
            return parseGeminiResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to analyze prescription: " + e.getMessage());
        }
    }

    @PostMapping("/query")
    public ResponseEntity<?> queryGemini(@RequestBody Map<String, Object> request) {
        log.info("Received text query request");

        try {
            if (!request.containsKey("message")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing field: message"));
            }
            String message = (String) request.get("message");

            // Build Request
            Map<String, Object> geminiRequest = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", message);
            parts.add(textPart);
            content.put("parts", parts);
            contents.add(content);
            geminiRequest.put("contents", contents);

            String apiUrl = GEMINI_API_BASE + model + ":generateContent?key=" + apiKey;
            
            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(geminiRequest);

            ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, Map.class);
            
            // For query endpoint, keeping JSON response but simplified or raw
             return ResponseEntity.ok(response.getBody());

        } catch (Exception e) {
            log.error("Error during text query", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private ResponseEntity<?> parseGeminiResponse(Map<String, Object> responseBody) {
        try {
            if (responseBody == null || !responseBody.containsKey("candidates")) {
                return ResponseEntity.ok("No analysis generated.");
            }
            
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            if (candidates.isEmpty()) return ResponseEntity.ok("No candidates returned.");

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            
            StringBuilder fullText = new StringBuilder();
            for (Map<String, Object> part : parts) {
                if (part.containsKey("text")) {
                    fullText.append(part.get("text"));
                }
            }

            // Return plain text as expected by frontend
            return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(fullText.toString());

        } catch (Exception e) {
            log.error("Error parsing Gemini response", e);
            return ResponseEntity.ok("Error parsing AI response.");
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Gemini Direct Proxy",
            "model", model,
            "timestamp", System.currentTimeMillis()
        ));
    }
}
