package com.healthconnect.dto;

import com.healthconnect.entity.AppointmentStatus;
import com.healthconnect.entity.AppointmentType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentUpdateRequest {
    
    private LocalDate date;
    
    private LocalTime startTime;
    
    private LocalTime endTime;
    
    private AppointmentStatus status;
    
    private AppointmentType type;
    
    private String reasonForVisit;
    
    private String notes;
    
    private String meetingLink;
}
