-- Create video_consultations table for telemedicine functionality
CREATE TABLE video_consultations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    room_id VARCHAR(255) NOT NULL UNIQUE,
    session_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    scheduled_start_time TIMESTAMP NOT NULL,
    actual_start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    duration_minutes INT NULL,
    doctor_join_time TIMESTAMP NULL,
    patient_join_time TIMESTAMP NULL,
    recording_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    recording_url TEXT NULL,
    recording_consent BOOLEAN NOT NULL DEFAULT FALSE,
    screen_sharing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    chat_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT NULL,
    prescription TEXT NULL,
    diagnosis TEXT NULL,
    recommendations TEXT NULL,
    follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_date TIMESTAMP NULL,
    technical_issues VARCHAR(500) NULL,
    quality_rating INT NULL,
    patient_satisfaction INT NULL,
    doctor_notes TEXT NULL,
    patient_feedback TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_video_consultation_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    CONSTRAINT fk_video_consultation_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_video_consultation_patient FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_video_consultations_appointment (appointment_id),
    INDEX idx_video_consultations_doctor (doctor_id),
    INDEX idx_video_consultations_patient (patient_id),
    INDEX idx_video_consultations_room_id (room_id),
    INDEX idx_video_consultations_status (status),
    INDEX idx_video_consultations_scheduled_time (scheduled_start_time),
    INDEX idx_video_consultations_created_at (created_at)
);

-- Add comments for documentation
ALTER TABLE video_consultations 
COMMENT = 'Stores video consultation sessions for telemedicine appointments';

ALTER TABLE video_consultations 
MODIFY COLUMN status VARCHAR(50) NOT NULL 
COMMENT 'Consultation status: SCHEDULED, WAITING_FOR_DOCTOR, WAITING_FOR_PATIENT, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW, TECHNICAL_ISSUES';

ALTER TABLE video_consultations 
MODIFY COLUMN type VARCHAR(50) NOT NULL 
COMMENT 'Consultation type: ROUTINE_CHECKUP, FOLLOW_UP, URGENT_CARE, SPECIALIST_CONSULTATION, MENTAL_HEALTH, PRESCRIPTION_REVIEW, SECOND_OPINION, EMERGENCY_CONSULTATION';

ALTER TABLE video_consultations 
MODIFY COLUMN room_id VARCHAR(255) NOT NULL 
COMMENT 'Unique room identifier for WebRTC session';

ALTER TABLE video_consultations 
MODIFY COLUMN session_id VARCHAR(255) 
COMMENT 'WebRTC session identifier';

ALTER TABLE video_consultations 
MODIFY COLUMN quality_rating INT 
COMMENT 'Call quality rating from 1-5 scale';

ALTER TABLE video_consultations 
MODIFY COLUMN patient_satisfaction INT 
COMMENT 'Patient satisfaction rating from 1-5 scale';
