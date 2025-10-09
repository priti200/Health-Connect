package com.healthconnect.entity;

public enum MessageType {
    TEXT,           // Regular text message
    IMAGE,          // Image attachment
    DOCUMENT,       // Document attachment (PDF, DOC, etc.)
    AUDIO,          // Audio message/recording
    VIDEO,          // Video attachment
    FILE,           // Generic file attachment
    SYSTEM,         // System-generated message
    APPOINTMENT,    // Appointment-related message
    PRESCRIPTION,   // Prescription-related message
    URGENT,         // Urgent medical message
    EMOJI,          // Emoji-only message
    LOCATION,       // Location sharing
    CONTACT,        // Contact sharing
    VOICE_CALL,     // Voice call invitation
    VIDEO_CALL      // Video call invitation
}
