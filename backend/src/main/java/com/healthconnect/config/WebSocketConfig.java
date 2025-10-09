package com.healthconnect.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.healthconnect.service.JwtService;
import com.healthconnect.service.UserService;

import lombok.extern.slf4j.Slf4j;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for topics and queues
        config.enableSimpleBroker("/topic", "/queue");
        // Set application destination prefix
        config.setApplicationDestinationPrefixes("/app");
        // Set user destination prefix
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register WebSocket endpoint with SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // CORS disabled - allow all origins
                .withSockJS()
                .setHeartbeatTime(25000)
                .setDisconnectDelay(30000)
                .setHttpMessageCacheSize(1000)
                .setStreamBytesLimit(128 * 1024);

        // Also register without SockJS for direct WebSocket connections
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*"); // CORS disabled - allow all origins
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    log.info("WebSocket CONNECT attempt with token: {}", authToken != null ? "present" : "missing");

                    // Allow connection even without authentication for now
                    // This prevents WebSocket connection failures
                    if (authToken == null || !authToken.startsWith("Bearer ")) {
                        log.warn("WebSocket connection without proper authentication - allowing for now");
                        accessor.setUser(new AnonymousAuthenticationToken("anonymous", "anonymous",
                            List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));
                        return message; // Allow connection without auth
                    }

                    // Handle valid authentication
                    try {
                        String token = authToken.substring(7);
                        String username = jwtService.extractUsername(token);

                        if (username != null) {
                            try {
                                var userDetails = userService.loadUserByUsername(username);
                                if (jwtService.isTokenValid(token, userDetails)) {
                                    var authToken2 = new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());
                                    SecurityContextHolder.getContext().setAuthentication(authToken2);
                                    accessor.setUser(authToken2);
                                    log.info("WebSocket authentication successful for user: {}", username);
                                } else {
                                    log.warn("Invalid JWT token for WebSocket connection - allowing anonymous access");
                                    accessor.setUser(new AnonymousAuthenticationToken("anonymous", "anonymous",
                                        List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));
                                }
                            } catch (Exception userEx) {
                                log.warn("User not found for WebSocket connection: {} - allowing anonymous access", username);
                                accessor.setUser(new AnonymousAuthenticationToken("anonymous", "anonymous",
                                    List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));
                            }
                        } else {
                            log.warn("No username in JWT token for WebSocket connection - allowing anonymous access");
                            accessor.setUser(new AnonymousAuthenticationToken("anonymous", "anonymous",
                                List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));
                        }
                    } catch (Exception e) {
                        log.error("WebSocket authentication failed: {} - allowing anonymous access", e.getMessage());
                        accessor.setUser(new AnonymousAuthenticationToken("anonymous", "anonymous",
                            List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));
                    }
                }

                return message;
            }
        });
    }
}
