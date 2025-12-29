import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { Chat, Message, ChatRequest, MessageRequest, TypingNotification } from '../models/chat.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chats`;
  private wsUrl = environment.wsUrl;

  private stompClient: Client | null = null;
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new Subject<Message>();
  private typingSubject = new Subject<TypingNotification>();
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  private messageStatusSubject = new Subject<any>();
  private messageReactionSubject = new Subject<any>();

  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public messages$ = this.messageSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public chats$ = this.chatsSubject.asObservable();
  public messageStatus$ = this.messageStatusSubject.asObservable();
  public messageReactions$ = this.messageReactionSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.initializeWebSocketConnection();
  }

  private initializeWebSocketConnection(): void {
    if (this.authService.isAuthenticated()) {
      this.connect();
    }

    // Listen for authentication changes
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  private reconnectAttempts = 0;
  private maxReconnectAttempts = environment.websocket?.maxReconnectAttempts || 5;

  private connect(): void {
    if (this.stompClient?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.warn('No authentication token available for WebSocket connection');
      return;
    }

    console.log('Connecting to WebSocket at:', this.wsUrl);
    console.log('Authentication token present:', !!token);

    // Clean up existing client if it exists to prevent leaks (zombie connections)
    if (this.stompClient) {
      try {
        console.log('Deactivating existing Stomp client before creating new one');
        this.stompClient.deactivate();
      } catch (e) {
        console.warn('Error deactivating existing client:', e);
      }
    }

    this.stompClient = new Client({
      webSocketFactory: () => {
        console.log('Creating SockJS connection to:', this.wsUrl);
        return new SockJS(this.wsUrl);
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      heartbeatIncoming: environment.websocket?.heartbeatIncoming || 25000,
      heartbeatOutgoing: environment.websocket?.heartbeatOutgoing || 25000,
      onConnect: (frame) => {
        this.connectionStatusSubject.next(true);
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        console.log('✅ WebSocket connected successfully');
        console.log('Connection frame:', frame);
        console.log('Session ID:', frame.headers['session']);
        this.subscribeToUserChannels();
      },
      onWebSocketClose: (event) => {
        this.connectionStatusSubject.next(false);
        console.log('❌ WebSocket connection closed:', event);
        this.handleReconnection('WebSocket closed');
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
        console.error('STOMP error headers:', frame.headers);
        console.error('STOMP error body:', frame.body);
        this.connectionStatusSubject.next(false);
        this.handleReconnection('STOMP error');
      },
      onWebSocketError: (error) => {
        console.error('❌ WebSocket error:', error);
        this.connectionStatusSubject.next(false);
        this.handleReconnection('WebSocket error');
      }
    });

    try {
      this.stompClient.activate();
      console.log('WebSocket activation initiated...');
    } catch (error) {
      console.error('Failed to activate WebSocket client:', error);
      this.connectionStatusSubject.next(false);
    }
  }

  private handleReconnection(reason: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      return;
    }

    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, skipping reconnection');
      return;
    }

    this.reconnectAttempts++;
    const delay = environment.websocket?.reconnectInterval || 3000;

    console.log(`🔄 Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) after ${reason} in ${delay}ms...`);

    setTimeout(() => {
      if (this.authService.isAuthenticated()) {
        this.connect();
      }
    }, delay);
  }

  private subscribeToUserChannels(): void {
    if (!this.stompClient?.connected) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    // Subscribe to error messages
    this.stompClient.subscribe('/user/queue/errors', (message) => {
      console.error('WebSocket error:', message.body);
    });
  }

  public subscribeToChatMessages(chatId: number): void {
    // Wait for connection if not ready
    if (!this.stompClient?.connected) {
      console.log('WebSocket not connected, waiting for connection...');
      // Wait for connection and then subscribe
      const subscription = this.connectionStatus$.subscribe(connected => {
        if (connected && this.stompClient?.connected) {
          console.log('WebSocket connected, subscribing to chat:', chatId);
          this.performChatSubscription(chatId);
          subscription.unsubscribe();
        }
      });
      return;
    }

    this.performChatSubscription(chatId);
  }

  private performChatSubscription(chatId: number): void {
    if (!this.stompClient?.connected) {
      console.error('Cannot subscribe: WebSocket not connected');
      return;
    }

    console.log('Subscribing to chat messages for chat:', chatId);

    // Subscribe to chat messages
    this.stompClient.subscribe(`/topic/chat/${chatId}`, (message) => {
      console.log('Received message:', message.body);
      const newMessage: Message = JSON.parse(message.body);
      this.messageSubject.next(newMessage);

      // Add notification for new messages from other users
      const currentUser = this.authService.getCurrentUser();
      if (newMessage.sender.id !== currentUser?.id) {
        this.notificationService.addMessageNotification(
          newMessage.sender,
          newMessage.content,
          chatId
        );
      }
    });

    // Subscribe to typing notifications
    this.stompClient.subscribe(`/topic/chat/${chatId}/typing`, (message) => {
      const typingNotification: TypingNotification = JSON.parse(message.body);
      this.typingSubject.next(typingNotification);
    });

    // Subscribe to message status updates
    this.stompClient.subscribe(`/topic/chat/${chatId}/status`, (message) => {
      const statusUpdate = JSON.parse(message.body);
      this.messageStatusSubject.next(statusUpdate);
    });

    // Subscribe to message reactions
    this.stompClient.subscribe(`/topic/chat/${chatId}/reactions`, (message) => {
      const reactionUpdate = JSON.parse(message.body);
      this.messageReactionSubject.next(reactionUpdate);
    });

    console.log('Successfully subscribed to chat:', chatId);
  }

  public sendMessage(chatId: number, content: string): void {
    console.log('Attempting to send message:', { chatId, content, connected: this.stompClient?.connected });

    if (!this.stompClient?.connected) {
      console.error('WebSocket not connected, cannot send message');
      throw new Error('WebSocket not connected');
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('No authentication token available');
      throw new Error('No authentication token');
    }

    const messageRequest: MessageRequest = {
      chatId,
      content
    };

    console.log('Publishing message:', messageRequest);

    try {
      this.stompClient.publish({
        destination: `/app/chat/${chatId}/send`,
        body: JSON.stringify(messageRequest),
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Message published successfully');
    } catch (error) {
      console.error('Failed to publish message:', error);
      throw error;
    }
  }

  public sendTypingNotification(chatId: number, isTyping: boolean): void {
    if (!this.stompClient?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.stompClient.publish({
      destination: `/app/chat/${chatId}/typing`,
      body: isTyping ? 'typing' : 'stopped',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  public forceConnect(): void {
    this.connect();
  }

  public disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.connectionStatusSubject.next(false);
    }
  }

  // HTTP API methods
  public createOrGetChat(participantId: number): Observable<Chat> {
    const request: ChatRequest = { participantId };

    console.log('Creating chat with:', {
      apiUrl: this.apiUrl,
      request,
      participantId: participantId,
      participantIdType: typeof participantId,
      token: this.authService.getToken(),
      currentUser: this.authService.getCurrentUser(),
      httpOptions: this.getHttpOptions()
    });

    // Validate participantId
    if (!participantId || typeof participantId !== 'number') {
      console.error('Invalid participantId:', participantId);
      return throwError(() => new Error('Invalid participant ID'));
    }

    return this.http.post<Chat>(this.apiUrl, request, this.getHttpOptions())
      .pipe(
        tap(chat => {
          console.log('Chat created/retrieved successfully:', chat);
        }),
        catchError(error => {
          console.error('Error creating/getting chat:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error,
            url: error.url
          });
          return throwError(() => error);
        })
      );
  }

  public getUserChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(this.apiUrl, this.getHttpOptions());
  }

  public getChatMessages(chatId: number, page: number = 0, size: number = 50): Observable<Message[]> {
    const params = { page: page.toString(), size: size.toString() };
    return this.http.get<Message[]>(`${this.apiUrl}/${chatId}/messages`, {
      ...this.getHttpOptions(),
      params
    });
  }

  public markMessagesAsRead(chatId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${chatId}/read`, {}, this.getHttpOptions());
  }

  public markMessageAsRead(messageId: number): void {
    if (!this.stompClient?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.stompClient.publish({
      destination: `/app/message/${messageId}/read`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  public addMessageReaction(messageId: number, reaction: string): void {
    if (!this.stompClient?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.stompClient.publish({
      destination: `/app/message/${messageId}/react`,
      body: JSON.stringify({ reaction }),
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  public sendMessageWithAttachment(chatId: number, content: string, file: File): Observable<Message> {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('file', file);

    return this.http.post<Message>(`${this.apiUrl}/${chatId}/messages/attachment`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    });
  }

  public replyToMessage(chatId: number, content: string, replyToMessageId: number): void {
    if (!this.stompClient?.connected) {
      throw new Error('WebSocket not connected');
    }

    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const messageRequest = {
      chatId,
      content,
      replyToMessageId
    };

    this.stompClient.publish({
      destination: `/app/chat/${chatId}/reply`,
      body: JSON.stringify(messageRequest),
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  public loadUserChats(): void {
    this.getUserChats().subscribe({
      next: (chats) => {
        this.chatsSubject.next(chats);
      },
      error: (error) => {
        console.error('Failed to load chats:', error);
      }
    });
  }

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }
}

