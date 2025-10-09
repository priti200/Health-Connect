package com.healthconnect.service;

import com.healthconnect.dto.AppointmentRequest;
import com.healthconnect.dto.AppointmentUpdateRequest;
import com.healthconnect.dto.TimeSlotResponse;
import com.healthconnect.entity.*;
import com.healthconnect.repository.AppointmentRepository;
import com.healthconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AppointmentService {
    
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    
    // Create a new appointment
    public Appointment createAppointment(AppointmentRequest request, User patient) {
        log.info("Creating appointment for patient: {} with doctor: {}", patient.getEmail(), request.getDoctorId());

        // Validate patient role
        if (!patient.isPatient()) {
            throw new RuntimeException("Only patients can book appointments");
        }

        // Validate doctor exists and is actually a doctor
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor with ID " + request.getDoctorId() + " not found"));

        if (!doctor.isDoctor()) {
            throw new RuntimeException("Selected user is not a doctor");
        }

        // Validate appointment date is not in the past
        if (request.getDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Appointment date cannot be in the past");
        }

        // Validate appointment time
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new RuntimeException("Start time must be before end time");
        }

        // Check for conflicts
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(
                doctor, request.getDate(), request.getStartTime(), request.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Doctor is not available at the requested time slot");
        }
        
        // Create appointment
        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setDate(request.getDate());
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        appointment.setType(request.getType());
        appointment.setReasonForVisit(request.getReasonForVisit());
        appointment.setNotes(request.getNotes());
        appointment.setStatus(AppointmentStatus.PENDING);

        // Save appointment first to get the ID
        appointment = appointmentRepository.save(appointment);

        // Generate meeting link for video calls after saving (so ID is available)
        if (request.getType() == AppointmentType.VIDEO_CALL) {
            appointment.setMeetingLink(generateMeetingLink(appointment));
            appointment = appointmentRepository.save(appointment);
        }

        return appointment;
    }
    
    // Get appointments for current user
    public List<Appointment> getAppointments(User user, AppointmentStatus status, 
                                           AppointmentType type, LocalDate startDate, LocalDate endDate) {
        List<Appointment> appointments;
        
        if (user.isDoctor()) {
            appointments = appointmentRepository.findByDoctorOrderByDateAscStartTimeAsc(user);
        } else {
            appointments = appointmentRepository.findByPatientOrderByDateAscStartTimeAsc(user);
        }
        
        // Apply filters
        return appointments.stream()
                .filter(a -> status == null || a.getStatus() == status)
                .filter(a -> type == null || a.getType() == type)
                .filter(a -> startDate == null || !a.getDate().isBefore(startDate))
                .filter(a -> endDate == null || !a.getDate().isAfter(endDate))
                .toList();
    }
    
    // Get appointment by ID
    public Optional<Appointment> getAppointmentById(Long id, User user) {
        Optional<Appointment> appointment = appointmentRepository.findById(id);
        
        // Check if user has access to this appointment
        if (appointment.isPresent()) {
            Appointment apt = appointment.get();
            if (!apt.getDoctor().getId().equals(user.getId()) && 
                !apt.getPatient().getId().equals(user.getId())) {
                return Optional.empty(); // User doesn't have access
            }
        }
        
        return appointment;
    }
    
    // Update appointment
    public Appointment updateAppointment(Long id, AppointmentUpdateRequest request, User user) {
        Appointment appointment = getAppointmentById(id, user)
                .orElseThrow(() -> new RuntimeException("Appointment not found or access denied"));
        
        // Only doctor or patient can update their own appointments
        boolean canUpdate = appointment.getDoctor().getId().equals(user.getId()) || 
                           appointment.getPatient().getId().equals(user.getId());
        
        if (!canUpdate) {
            throw new RuntimeException("Not authorized to update this appointment");
        }
        
        // Update fields if provided
        if (request.getDate() != null) {
            appointment.setDate(request.getDate());
        }
        if (request.getStartTime() != null) {
            appointment.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            appointment.setEndTime(request.getEndTime());
        }
        if (request.getStatus() != null) {
            appointment.setStatus(request.getStatus());
        }
        if (request.getType() != null) {
            appointment.setType(request.getType());
            // Generate meeting link for video calls (ID should already exist for updates)
            if (request.getType() == AppointmentType.VIDEO_CALL && appointment.getMeetingLink() == null) {
                appointment.setMeetingLink(generateMeetingLink(appointment));
            }
        }
        if (request.getReasonForVisit() != null) {
            appointment.setReasonForVisit(request.getReasonForVisit());
        }
        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes());
        }
        if (request.getMeetingLink() != null) {
            appointment.setMeetingLink(request.getMeetingLink());
        }
        
        return appointmentRepository.save(appointment);
    }
    
    // Cancel appointment
    public void cancelAppointment(Long id, User user) {
        Appointment appointment = getAppointmentById(id, user)
                .orElseThrow(() -> new RuntimeException("Appointment not found or access denied"));
        
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
    }
    
    // Get available time slots for a doctor
    public List<TimeSlotResponse> getAvailableTimeSlots(Long doctorId, LocalDate date) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        if (!doctor.isDoctor()) {
            throw new RuntimeException("User is not a doctor");
        }
        
        // Get existing appointments for the doctor on this date
        List<Appointment> existingAppointments = appointmentRepository
                .findByDoctorAndDateOrderByStartTimeAsc(doctor, date);
        
        // Generate time slots (9 AM to 5 PM, 30-minute slots)
        List<TimeSlotResponse> timeSlots = new ArrayList<>();
        LocalTime currentTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(17, 0);

        while (currentTime.isBefore(endTime)) {
            LocalTime slotEnd = currentTime.plusMinutes(30);
            TimeSlotResponse slot = new TimeSlotResponse(date, currentTime, slotEnd);

            // Check if this slot conflicts with existing appointments
            final LocalTime finalCurrentTime = currentTime;
            final LocalTime finalSlotEnd = slotEnd;
            boolean isAvailable = existingAppointments.stream()
                    .noneMatch(apt -> apt.getStatus() != AppointmentStatus.CANCELLED &&
                                     apt.getStatus() != AppointmentStatus.NO_SHOW &&
                                     isTimeSlotConflict(finalCurrentTime, finalSlotEnd, apt.getStartTime(), apt.getEndTime()));

            slot.setAvailable(isAvailable);
            timeSlots.add(slot);

            currentTime = slotEnd;
        }
        
        return timeSlots;
    }
    
    // Get today's appointments for a user
    public List<Appointment> getTodayAppointments(User user) {
        LocalDate today = LocalDate.now();
        
        if (user.isDoctor()) {
            return appointmentRepository.findTodayAppointmentsByDoctor(user, today);
        } else {
            return appointmentRepository.findTodayAppointmentsByPatient(user, today);
        }
    }
    
    // Helper methods
    private boolean isTimeSlotConflict(LocalTime slot1Start, LocalTime slot1End, 
                                      LocalTime slot2Start, LocalTime slot2End) {
        return slot1Start.isBefore(slot2End) && slot1End.isAfter(slot2Start);
    }
    
    private String generateMeetingLink(Appointment appointment) {
        // In a real application, this would integrate with a video conferencing service
        // For now, we'll generate a simple meeting room URL
        return "https://healthconnect.meet/room/" + appointment.getId() + "-" + 
               appointment.getDate().toString() + "-" + 
               appointment.getStartTime().toString().replace(":", "");
    }
}
