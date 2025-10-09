import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface AiChatRequest {
  message: string;
  conversationId?: number;
  conversationType?: ConversationType;
  conversationTitle?: string;
  isNewConversation?: boolean;
}

export interface AiChatResponse {
  conversationId: number;
  conversationTitle: string;
  conversationType: ConversationType;
  userMessage: string;
  aiResponse: string;
  timestamp: string;
  metadata?: string;
  isNewConversation: boolean;
}

export interface AiConversation {
  id: number;
  title: string;
  conversationType: ConversationType;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  isSharedWithDoctor: boolean;
  sharedWithDoctorId?: number;
  sharedAt?: string;
  messageCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  messages?: AiMessage[];
}

export interface AiMessage {
  id: number;
  content: string;
  role: 'USER' | 'ASSISTANT';
  timestamp: string;
  metadata?: string;
}

export enum ConversationType {
  GENERAL_HEALTH = 'GENERAL_HEALTH',
  SYMPTOM_ANALYSIS = 'SYMPTOM_ANALYSIS',
  MEDICATION_INQUIRY = 'MEDICATION_INQUIRY',
  WELLNESS_TIPS = 'WELLNESS_TIPS',
  EMERGENCY_GUIDANCE = 'EMERGENCY_GUIDANCE'
}

@Injectable({
  providedIn: 'root'
})
export class AiHealthBotService {
  private apiUrl = `${environment.apiUrl}/ai-health-bot`;
  private currentConversationSubject = new BehaviorSubject<AiConversation | null>(null);
  public currentConversation$ = this.currentConversationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  sendMessage(request: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${this.apiUrl}/chat`, request, this.getHttpOptions());
  }

  getUserConversations(): Observable<AiConversation[]> {
    return this.http.get<AiConversation[]>(`${this.apiUrl}/conversations`, this.getHttpOptions());
  }

  getUserConversationsPaginated(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/conversations/paginated?page=${page}&size=${size}`, this.getHttpOptions());
  }

  getConversationDetails(conversationId: number): Observable<AiConversation> {
    return this.http.get<AiConversation>(`${this.apiUrl}/conversations/${conversationId}`, this.getHttpOptions());
  }

  setCurrentConversation(conversation: AiConversation | null): void {
    this.currentConversationSubject.next(conversation);
  }

  getCurrentConversation(): AiConversation | null {
    return this.currentConversationSubject.value;
  }

  getConversationTypeDisplayName(type: ConversationType): string {
    switch (type) {
      case ConversationType.GENERAL_HEALTH:
        return 'General Health';
      case ConversationType.SYMPTOM_ANALYSIS:
        return 'Symptom Analysis';
      case ConversationType.MEDICATION_INQUIRY:
        return 'Medication Inquiry';
      case ConversationType.WELLNESS_TIPS:
        return 'Wellness Tips';
      case ConversationType.EMERGENCY_GUIDANCE:
        return 'Emergency Guidance';
      default:
        return 'General Health';
    }
  }

  getConversationTypeIcon(type: ConversationType): string {
    switch (type) {
      case ConversationType.GENERAL_HEALTH:
        return 'heart';
      case ConversationType.SYMPTOM_ANALYSIS:
        return 'activity';
      case ConversationType.MEDICATION_INQUIRY:
        return 'pill';
      case ConversationType.WELLNESS_TIPS:
        return 'sun';
      case ConversationType.EMERGENCY_GUIDANCE:
        return 'alert-triangle';
      default:
        return 'heart';
    }
  }

  healthCheck(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/health`, this.getHttpOptions());
  }
}
