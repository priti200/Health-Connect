package com.healthconnect.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now());
        health.put("service", "HealthConnect Backend");
        health.put("version", "1.0.0");
        return ResponseEntity.ok(health);
    }

    @GetMapping("/websocket")
    public ResponseEntity<Map<String, Object>> websocketHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("websocket", "ENABLED");
        health.put("endpoint", "/api/ws");
        health.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(health);
    }
}
