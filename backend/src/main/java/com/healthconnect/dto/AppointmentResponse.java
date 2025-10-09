package com.healthconnect.dto;

import com.healthconnect.entity.Appointment;
import com.healthconnect.entity.AppointmentStatus;
import com.healthconnect.entity.AppointmentType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {
    
    private Long id;
    private UserSummary doctor;
    private UserSummary patient;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private AppointmentStatus status;
    private AppointmentType type;
    private String reasonForVisit;
    private String notes;
    private String meetingLink;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor from Appointment entity
    public AppointmentResponse(Appointment appointment) {
        this.id = appointment.getId();
        this.doctor = new UserSummary(appointment.getDoctor());
        this.patient = new UserSummary(appointment.getPatient());
        this.date = appointment.getDate();
        this.startTime = appointment.getStartTime();
        this.endTime = appointment.getEndTime();
        this.status = appointment.getStatus();
        this.type = appointment.getType();
        this.reasonForVisit = appointment.getReasonForVisit();
        this.notes = appointment.getNotes();
        this.meetingLink = appointment.getMeetingLink();
        this.createdAt = appointment.getCreatedAt();
        this.updatedAt = appointment.getUpdatedAt();
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String fullName;
        private String email;
        private String specialization;
        private String affiliation;
        
        public UserSummary(com.healthconnect.entity.User user) {
            this.id = user.getId();
            this.fullName = user.getFullName();
            this.email = user.getEmail();
            this.specialization = user.getSpecialization();
            this.affiliation = user.getAffiliation();
        }
    }
}
