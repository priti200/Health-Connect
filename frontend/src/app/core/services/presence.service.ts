import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval } from 'rxjs';
import { AuthService } from './auth.service';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';

export interface UserPresence {
  userId: number;
  userName: string;
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE' | 'INVISIBLE';
  statusMessage?: string;
  lastSeen: Date;
  isTyping?: boolean;
  typingInChatId?: number;
}

export interface TypingNotification {
  userId: number;
  chatId: number;
  isTyping: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private stompClient: Client | null = null;
  private wsUrl = environment.wsUrl;

  private userPresences$ = new BehaviorSubject<Map<number, UserPresence>>(new Map());
  private currentUserPresence$ = new BehaviorSubject<UserPresence | null>(null);
  private typingNotifications$ = new Subject<TypingNotification>();
  private connectionStatus$ = new BehaviorSubject<boolean>(false);

  private heartbeatInterval: any;
  private typingTimeouts = new Map<number, any>();

  constructor(private authService: AuthService) {
    // Initialize connection after a short delay to avoid circular dependency issues
    setTimeout(() => {
      this.initializeConnection();
    }, 100);
  }

  private initializeConnection(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    // Check if we already have an active client
    if (this.stompClient) {
      if (this.stompClient.connected) {
        return;
      }
      // If we have a client but it's not connected, it might be connecting or dead.
      // Safest is to deactivate it before creating a new one to prevent leaks.
      try {
        this.stompClient.deactivate();
      } catch (e) {
        console.warn('Error deactivating existing stomp client:', e);
      }
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        console.log('Presence STOMP Debug:', str);
      },
      onConnect: () => {
        this.connectionStatus$.next(true);
        console.log('Presence WebSocket connected');
        this.subscribeToPresenceUpdates();
        this.startHeartbeat();
        this.updatePresence('ONLINE');
      },
      onWebSocketClose: () => {
        this.connectionStatus$.next(false);
        console.log('Presence WebSocket disconnected');
        this.stopHeartbeat();
        // Try to reconnect after 5 seconds
        setTimeout(() => {
          if (this.authService.isAuthenticated()) {
            this.connect();
          }
        }, 5000);
      },
      onStompError: (frame) => {
        console.error('Presence STOMP error:', frame);
        this.connectionStatus$.next(false);
      }
    });

    this.stompClient.activate();
  }

  private subscribeToPresenceUpdates(): void {
    if (!this.stompClient?.connected) {
      return;
    }

    // Subscribe to global presence updates
    this.stompClient.subscribe('/topic/presence', (message) => {
      const presenceUpdate = JSON.parse(message.body);
      this.handlePresenceUpdate(presenceUpdate);
    });

    // Subscribe to typing notifications for all chats
    this.stompClient.subscribe('/topic/chat/+/typing', (message) => {
      const typingNotification = JSON.parse(message.body);
      this.handleTypingNotification(typingNotification);
    });
  }

  private handlePresenceUpdate(update: any): void {
    const presence: UserPresence = {
      userId: update.userId,
      userName: update.userName,
      status: update.status,
      statusMessage: update.statusMessage,
      lastSeen: new Date(update.lastSeen)
    };

    const presences = this.userPresences$.value;
    presences.set(presence.userId, presence);
    this.userPresences$.next(new Map(presences));

    // Update current user presence if it's for the current user
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id === presence.userId) {
      this.currentUserPresence$.next(presence);
    }
  }

  private handleTypingNotification(notification: any): void {
    const typingNotif: TypingNotification = {
      userId: notification.userId,
      chatId: notification.chatId,
      isTyping: notification.isTyping,
      timestamp: new Date(notification.timestamp)
    };

    this.typingNotifications$.next(typingNotif);

    // Update user presence with typing status
    const presences = this.userPresences$.value;
    const userPresence = presences.get(typingNotif.userId);
    if (userPresence) {
      userPresence.isTyping = typingNotif.isTyping;
      userPresence.typingInChatId = typingNotif.isTyping ? typingNotif.chatId : undefined;
      presences.set(typingNotif.userId, userPresence);
      this.userPresences$.next(new Map(presences));
    }
  }

  private startHeartbeat(): void {
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = interval(30000).subscribe(() => {
      this.sendHeartbeat();
    });
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      this.heartbeatInterval.unsubscribe();
      this.heartbeatInterval = null;
    }
  }

  private sendHeartbeat(): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/presence/heartbeat',
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`
        }
      });
    }
  }

  public connect(): void {
    if (!this.stompClient?.connected) {
      this.initializeConnection();
    }
  }

  public disconnect(): void {
    this.updatePresence('OFFLINE');
    this.stopHeartbeat();
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.connectionStatus$.next(false);
    }
  }

  public updatePresence(status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE' | 'INVISIBLE', statusMessage?: string): void {
    if (!this.stompClient?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    const request = {
      status: status,
      statusMessage: statusMessage,
      deviceInfo: navigator.userAgent,
      ipAddress: '' // Will be set by server
    };

    this.stompClient.publish({
      destination: '/app/presence/update',
      body: JSON.stringify(request),
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  public startTyping(chatId: number): void {
    if (!this.stompClient?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.stompClient.publish({
      destination: `/app/chat/${chatId}/typing`,
      body: 'typing',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Clear any existing timeout for this chat
    const existingTimeout = this.typingTimeouts.get(chatId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Auto-stop typing after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      this.stopTyping(chatId);
    }, 3000);
    this.typingTimeouts.set(chatId, timeout);
  }

  public stopTyping(chatId: number): void {
    if (!this.stompClient?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.stompClient.publish({
      destination: `/app/chat/${chatId}/typing`,
      body: 'stopped',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Clear timeout
    const timeout = this.typingTimeouts.get(chatId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(chatId);
    }
  }

  public getUserPresence(userId: number): UserPresence | null {
    return this.userPresences$.value.get(userId) || null;
  }

  public isUserOnline(userId: number): boolean {
    const presence = this.getUserPresence(userId);
    return presence ? ['ONLINE', 'BUSY', 'AWAY'].includes(presence.status) : false;
  }

  public isUserTyping(userId: number, chatId?: number): boolean {
    const presence = this.getUserPresence(userId);
    if (!presence || !presence.isTyping) {
      return false;
    }
    return chatId ? presence.typingInChatId === chatId : true;
  }

  // Observables
  public getUserPresences(): Observable<Map<number, UserPresence>> {
    return this.userPresences$.asObservable();
  }

  public getCurrentUserPresence(): Observable<UserPresence | null> {
    return this.currentUserPresence$.asObservable();
  }

  public getTypingNotifications(): Observable<TypingNotification> {
    return this.typingNotifications$.asObservable();
  }

  public getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  public getOnlineUsers(): UserPresence[] {
    const presences = this.userPresences$.value;
    return Array.from(presences.values()).filter(p =>
      ['ONLINE', 'BUSY', 'AWAY'].includes(p.status)
    );
  }
}
