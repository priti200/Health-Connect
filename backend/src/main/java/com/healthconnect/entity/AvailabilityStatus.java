package com.healthconnect.entity;

public enum AvailabilityStatus {
    ONLINE,         // Doctor is online and available for chat
    BUSY,           // Doctor is online but busy (in consultation)
    AWAY,           // Doctor is away but will respond later
    OFFLINE,        // Doctor is offline
    DO_NOT_DISTURB  // Doctor should not be contacted except for emergencies
}
