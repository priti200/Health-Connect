package com.healthconnect.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallQualityMetrics {
    private Long consultationId;
    private String roomId;
    private Long userId;
    private Integer audioQuality; // 1-5 scale
    private Integer videoQuality; // 1-5 scale
    private Integer connectionStability; // 1-5 scale
    private Long latencyMs;
    private Double packetLossPercentage;
    private String networkType; // wifi, cellular, ethernet
    private String deviceType; // desktop, mobile, tablet
    private String browserInfo;
    private Long timestamp;
}
