package com.healthconnect.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebRTCSignalRequest {
    private String type; // OFFER, ANSWER, ICE_CANDIDATE, SCREEN_SHARE_START, SCREEN_SHARE_STOP
    private String roomId;
    private String targetPeerId;
    private String fromPeerId;
    private Long userId;
    private Object data; // SDP offer/answer or ICE candidate data
    private String sdp;
    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;
}
