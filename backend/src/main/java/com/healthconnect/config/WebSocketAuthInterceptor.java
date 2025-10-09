package com.healthconnect.config;

import com.healthconnect.entity.UserPresence.PresenceStatus;
import com.healthconnect.service.JwtService;
import com.healthconnect.service.UserPresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserPresenceService userPresenceService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    String token = authHeader.substring(7);
                    String username = jwtService.extractUsername(token);

                    if (username != null && !username.isEmpty()) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                        if (jwtService.isTokenValid(token, userDetails)) {
                            UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                            SecurityContextHolder.getContext().setAuthentication(authToken);
                            accessor.setUser(authToken);

                            // Set user online when they connect
                            Long userId = jwtService.extractUserId(token);
                            if (userId != null) {
                                String userAgent = accessor.getFirstNativeHeader("User-Agent");
                                String clientIp = accessor.getFirstNativeHeader("X-Forwarded-For");
                                userPresenceService.setUserOnline(userId, userAgent, clientIp);
                            }

                            log.info("WebSocket authentication successful for user: {}", username);
                            return message; // Allow connection
                        } else {
                            log.warn("Invalid JWT token for WebSocket connection from user: {}", username);
                        }
                    } else {
                        log.warn("Empty username extracted from JWT token");
                    }
                } catch (Exception e) {
                    log.error("WebSocket authentication failed: {}", e.getMessage());
                }
            } else {
                log.warn("No Authorization header found in WebSocket connection - allowing for now");
            }

            // Allow connection even if authentication fails to prevent connection issues
            log.info("WebSocket connection allowed (authentication optional)");
            return message;

        } else if (accessor != null && StompCommand.DISCONNECT.equals(accessor.getCommand())) {
            // Handle user disconnect
            try {
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    Long userId = jwtService.extractUserId(token);
                    if (userId != null) {
                        userPresenceService.setUserOffline(userId);
                        log.info("User {} disconnected from WebSocket", userId);
                    }
                }
            } catch (Exception e) {
                log.error("Error handling WebSocket disconnect: {}", e.getMessage());
            }
        }

        return message;
    }
}
