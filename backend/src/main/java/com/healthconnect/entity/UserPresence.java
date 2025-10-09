package com.healthconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_presence")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPresence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PresenceStatus status = PresenceStatus.OFFLINE;

    @Column
    private String statusMessage;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime lastSeen = LocalDateTime.now();

    @Column
    private LocalDateTime lastActivity;

    @Column
    private String deviceInfo;

    @Column
    private String ipAddress;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isTyping = false;

    @Column
    private Long typingInChatId;

    @Column
    private LocalDateTime typingStartedAt;

    @PrePersist
    protected void onCreate() {
        lastSeen = LocalDateTime.now();
        lastActivity = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastActivity = LocalDateTime.now();
    }

    public void updatePresence(PresenceStatus status) {
        this.status = status;
        this.lastSeen = LocalDateTime.now();
        this.lastActivity = LocalDateTime.now();
    }

    public void startTyping(Long chatId) {
        this.isTyping = true;
        this.typingInChatId = chatId;
        this.typingStartedAt = LocalDateTime.now();
    }

    public void stopTyping() {
        this.isTyping = false;
        this.typingInChatId = null;
        this.typingStartedAt = null;
    }

    public boolean isOnline() {
        return status == PresenceStatus.ONLINE || status == PresenceStatus.BUSY;
    }

    public boolean isRecentlyActive() {
        return lastActivity != null && 
               lastActivity.isAfter(LocalDateTime.now().minusMinutes(5));
    }

    public enum PresenceStatus {
        ONLINE,     // User is actively online
        AWAY,       // User is away from keyboard
        BUSY,       // User is busy/in a call
        OFFLINE,    // User is offline
        INVISIBLE   // User appears offline but is online
    }
}
