package com.healthconnect.controller;

import com.healthconnect.dto.AppointmentRequest;
import com.healthconnect.dto.AppointmentUpdateRequest;
import com.healthconnect.dto.AppointmentResponse;
import com.healthconnect.entity.Appointment;
import com.healthconnect.entity.AppointmentStatus;
import com.healthconnect.entity.AppointmentType;
import com.healthconnect.entity.User;
import com.healthconnect.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.validation.FieldError;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;



@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Slf4j
// CORS disabled - removed @CrossOrigin annotation
public class AppointmentController {
    
    private final AppointmentService appointmentService;
    
    // Get appointments with optional filters
    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAppointments(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) AppointmentType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<Appointment> appointments = appointmentService.getAppointments(user, status, type, startDate, endDate);
        List<AppointmentResponse> response = appointments.stream()
                .map(AppointmentResponse::new)
                .toList();
        return ResponseEntity.ok(response);
    }
    
    // Get appointment by ID
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        return appointmentService.getAppointmentById(id, user)
                .map(appointment -> ResponseEntity.ok(new AppointmentResponse(appointment)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Create new appointment
    @PostMapping
    public ResponseEntity<?> createAppointment(
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal User user) {

        try {
            log.info("Creating appointment for user: {} with request: {}", user.getEmail(), request);
            log.info("Request details - doctorId: {}, date: {}, startTime: {}, endTime: {}, type: {}",
                    request.getDoctorId(), request.getDate(), request.getStartTime(),
                    request.getEndTime(), request.getType());
            Appointment appointment = appointmentService.createAppointment(request, user);
            log.info("Appointment created successfully with ID: {}", appointment.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(new AppointmentResponse(appointment));
        } catch (RuntimeException e) {
            log.error("Error creating appointment: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now().toString());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Unexpected error creating appointment: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "An unexpected error occurred: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now().toString());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // Update appointment
    @PutMapping("/{id}")
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable Long id,
            @RequestBody AppointmentUpdateRequest request,
            @AuthenticationPrincipal User user) {

        try {
            Appointment appointment = appointmentService.updateAppointment(id, request, user);
            return ResponseEntity.ok(new AppointmentResponse(appointment));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Cancel appointment
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        
        try {
            appointmentService.cancelAppointment(id, user);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Get today's appointments
    @GetMapping("/today")
    public ResponseEntity<List<AppointmentResponse>> getTodayAppointments(
            @AuthenticationPrincipal User user) {

        List<Appointment> appointments = appointmentService.getTodayAppointments(user);
        List<AppointmentResponse> response = appointments.stream()
                .map(AppointmentResponse::new)
                .toList();
        return ResponseEntity.ok(response);
    }

    // Handle validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, Object> errorResponse = new HashMap<>();
        Map<String, String> fieldErrors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            if (error instanceof FieldError) {
                FieldError fieldError = (FieldError) error;
                fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
            } else {
                fieldErrors.put("global", error.getDefaultMessage());
            }
        });

        errorResponse.put("message", "Validation Failed");
        errorResponse.put("errors", fieldErrors);
        errorResponse.put("timestamp", LocalDateTime.now().toString());

        log.error("Validation errors: {}", fieldErrors);

        return ResponseEntity.badRequest().body(errorResponse);
    }
}
