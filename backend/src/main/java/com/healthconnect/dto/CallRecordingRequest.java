package com.healthconnect.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallRecordingRequest {
    private Long consultationId;
    private String recordingData; // Base64 encoded recording data
    private String fileName;
    private String mimeType;
    private Long fileSizeBytes;
    private Integer durationSeconds;
    private Boolean patientConsent;
    private Boolean doctorConsent;
}
