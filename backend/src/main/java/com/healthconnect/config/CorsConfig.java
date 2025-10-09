package com.healthconnect.config;

import org.springframework.context.annotation.Configuration;

// CORS configuration is now handled entirely in SecurityConfig.java
// This class is kept for potential future use but is currently disabled
// to avoid conflicts with the SecurityConfig CORS configuration

@Configuration
public class CorsConfig {
    // CORS configuration moved to SecurityConfig.corsConfigurationSource()
    // This avoids conflicts between Spring Security CORS and WebMvc CORS
}
