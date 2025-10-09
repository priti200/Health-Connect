package com.healthconnect.service;

import io.agora.media.RtcTokenBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AgoraTokenService {

    @Value("${agora.app.id}")
    private String appId;

    @Value("${agora.app.certificate}")
    private String appCertificate;

    /**
     * Generate a proper Agora RTC token using the official library
     */
    public String generateRtcToken(String channelName, int uid, int expireTimeInSeconds) {
        try {
            if (!isConfigurationValid()) {
                log.warn("Agora configuration is invalid, returning null token for testing");
                return null;
            }

            long currentTimestamp = System.currentTimeMillis() / 1000;
            long privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;

            // Use the official Agora token builder
            RtcTokenBuilder tokenBuilder = new RtcTokenBuilder();
            String token = tokenBuilder.buildTokenWithUid(
                appId,
                appCertificate,
                channelName,
                uid,
                RtcTokenBuilder.Role.Role_Publisher,
                (int) privilegeExpiredTs
            );

            log.info("Generated Agora token for channel: {}, uid: {}, expires: {}", channelName, uid, privilegeExpiredTs);
            return token;

        } catch (Exception e) {
            log.error("Error generating Agora token: {}", e.getMessage());
            // Return null for testing mode
            return null;
        }
    }



    /**
     * Validate if the app configuration is valid
     */
    public boolean isConfigurationValid() {
        return appId != null && !appId.isEmpty() && 
               appCertificate != null && !appCertificate.isEmpty();
    }

    /**
     * Get app configuration for client
     */
    public String getAppId() {
        return appId;
    }
}
