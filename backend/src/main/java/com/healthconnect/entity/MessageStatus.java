package com.healthconnect.entity;

public enum MessageStatus {
    SENDING,     // Message is being sent
    SENT,        // Message sent successfully
    DELIVERED,   // Message delivered to recipient
    READ,        // Message read by recipient
    FAILED,      // Message failed to send
    EDITED,      // Message was edited
    DELETED      // Message was deleted
}
