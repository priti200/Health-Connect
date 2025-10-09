package com.healthconnect.controller;

import com.healthconnect.service.AgoraTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/agora")
@Slf4j
@RequiredArgsConstructor
public class AgoraTokenController {

    private final AgoraTokenService agoraTokenService;

    @GetMapping("/token")
    public ResponseEntity<Map<String, String>> getRtcToken(
            @RequestParam String channelName,
            @RequestParam int uid,
            @RequestParam(defaultValue = "3600") int expireTimeInSeconds) {

        log.info("Generating Agora token for channel: {} and uid: {}", channelName, uid);

        try {
            // Generate token using the service
            String token = agoraTokenService.generateRtcToken(channelName, uid, expireTimeInSeconds);

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("appId", agoraTokenService.getAppId());
            response.put("channelName", channelName);
            response.put("uid", String.valueOf(uid));
            response.put("status", "success");

            if (token == null) {
                response.put("message", "Using testing mode - no token required");
            } else {
                response.put("message", "Token generated successfully");
            }

            log.info("Agora token provided successfully for channel: {}", channelName);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error generating Agora token: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to generate token");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/token")
    public ResponseEntity<Map<String, String>> generateRtcToken(@RequestBody Map<String, Object> request) {
        try {
            String channelName = (String) request.get("channelName");
            Integer uid = (Integer) request.get("uid");
            Integer expireTimeInSeconds = (Integer) request.getOrDefault("expireTimeInSeconds", 3600);

            log.info("Generating Agora token for channel: {} and uid: {}", channelName, uid);

            String token = agoraTokenService.generateRtcToken(channelName, uid, expireTimeInSeconds);

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("appId", agoraTokenService.getAppId());
            response.put("channelName", channelName);
            response.put("uid", String.valueOf(uid));
            response.put("status", "success");

            if (token == null) {
                response.put("message", "Using testing mode - no token required");
            } else {
                response.put("message", "Token generated successfully");
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generating Agora token: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to generate token");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getAgoraConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("appId", agoraTokenService.getAppId());
        config.put("isConfigValid", String.valueOf(agoraTokenService.isConfigurationValid()));
        config.put("message", "Agora configuration for HealthConnect video calling");

        return ResponseEntity.ok(config);
    }
}
