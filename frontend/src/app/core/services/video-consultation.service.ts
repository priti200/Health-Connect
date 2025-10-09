import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface VideoConsultation {
  id: number;
  roomId: string;
  sessionId: string;
  appointment: any;
  doctor: any;
  patient: any;
  status: 'SCHEDULED' | 'WAITING_FOR_DOCTOR' | 'WAITING_FOR_PATIENT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'TECHNICAL_ISSUES';
  type: 'ROUTINE_CHECKUP' | 'FOLLOW_UP' | 'URGENT_CARE' | 'SPECIALIST_CONSULTATION' | 'MENTAL_HEALTH' | 'PRESCRIPTION_REVIEW' | 'SECOND_OPINION' | 'EMERGENCY_CONSULTATION';
  scheduledStartTime: string;
  actualStartTime?: string;
  endTime?: string;
  durationMinutes?: number;
  doctorJoinTime?: string;
  patientJoinTime?: string;
  recordingEnabled: boolean;
  recordingUrl?: string;
  recordingConsent: boolean;
  screenSharingEnabled: boolean;
  chatEnabled: boolean;
  notes?: string;
  prescription?: string;
  diagnosis?: string;
  recommendations?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  technicalIssues?: string;
  qualityRating?: number;
  patientSatisfaction?: number;
  doctorNotes?: string;
  patientFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationSettings {
  recordingEnabled: boolean;
  screenSharingEnabled: boolean;
  chatEnabled: boolean;
}

export interface ConsultationFeedback {
  qualityRating: number;
  satisfaction: number;
  feedback: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoConsultationService {
  private apiUrl = `${environment.apiUrl}/video-consultation`;
  private currentConsultation$ = new BehaviorSubject<VideoConsultation | null>(null);

  constructor(private http: HttpClient) {}

  // Create consultation
  createConsultation(appointmentId: number, type: string): Observable<VideoConsultation> {
    return this.http.post<VideoConsultation>(`${this.apiUrl}/create`, {
      appointmentId,
      type
    });
  }

  // Start consultation
  startConsultation(consultationId: number): Observable<VideoConsultation> {
    return this.http.post<VideoConsultation>(`${this.apiUrl}/${consultationId}/start`, {});
  }

  // End consultation
  endConsultation(consultationId: number, notes: string, diagnosis: string, recommendations: string): Observable<VideoConsultation> {
    return this.http.post<VideoConsultation>(`${this.apiUrl}/${consultationId}/end`, {
      notes,
      diagnosis,
      recommendations
    });
  }

  // Get consultation by ID
  getConsultation(consultationId: number): Observable<VideoConsultation> {
    return this.http.get<VideoConsultation>(`${this.apiUrl}/${consultationId}`);
  }

  // Get consultation by room ID
  getConsultationByRoomId(roomId: string): Observable<VideoConsultation> {
    console.log('[DEBUG] getConsultationByRoomId called with:', roomId, 'URL:', `${this.apiUrl}/room/${roomId}`);
    return this.http.get<VideoConsultation>(`${this.apiUrl}/room/${roomId}`);
  }

  // Get user consultations
  getUserConsultations(): Observable<VideoConsultation[]> {
    return this.http.get<VideoConsultation[]>(`${this.apiUrl}/user/consultations`);
  }

  // Get upcoming consultations
  getUpcomingConsultations(): Observable<VideoConsultation[]> {
    return this.http.get<VideoConsultation[]>(`${this.apiUrl}/user/upcoming`);
  }

  // Get consultation by appointment ID
  getConsultationByAppointmentId(appointmentId: number): Observable<VideoConsultation | null> {
    return this.http.get<VideoConsultation>(`${this.apiUrl}/appointment/${appointmentId}`).pipe(
      catchError(error => {
        if (error.status === 404) {
          return of(null); // No consultation found for this appointment
        }
        throw error;
      })
    );
  }

  // Update consultation settings
  updateConsultationSettings(consultationId: number, settings: ConsultationSettings): Observable<VideoConsultation> {
    return this.http.put<VideoConsultation>(`${this.apiUrl}/${consultationId}/settings`, settings);
  }

  // Submit feedback
  submitFeedback(consultationId: number, feedback: ConsultationFeedback): Observable<VideoConsultation> {
    return this.http.post<VideoConsultation>(`${this.apiUrl}/${consultationId}/feedback`, feedback);
  }

  // Current consultation state management
  setCurrentConsultation(consultation: VideoConsultation | null): void {
    this.currentConsultation$.next(consultation);
  }

  getCurrentConsultation(): Observable<VideoConsultation | null> {
    return this.currentConsultation$.asObservable();
  }

  getCurrentConsultationValue(): VideoConsultation | null {
    return this.currentConsultation$.value;
  }

  // Utility methods
  isConsultationActive(consultation: VideoConsultation): boolean {
    return ['WAITING_FOR_DOCTOR', 'WAITING_FOR_PATIENT', 'IN_PROGRESS'].includes(consultation.status);
  }

  canJoinConsultation(consultation: VideoConsultation): boolean {
    const now = new Date();
    const scheduledTime = new Date(consultation.scheduledStartTime);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Allow joining 15 minutes before scheduled time
    return minutesDiff <= 15 && consultation.status !== 'COMPLETED' && consultation.status !== 'CANCELLED';
  }

  getConsultationStatusColor(status: string): string {
    switch (status) {
      case 'SCHEDULED': return 'primary';
      case 'WAITING_FOR_DOCTOR':
      case 'WAITING_FOR_PATIENT': return 'warning';
      case 'IN_PROGRESS': return 'success';
      case 'COMPLETED': return 'info';
      case 'CANCELLED':
      case 'NO_SHOW': return 'danger';
      case 'TECHNICAL_ISSUES': return 'secondary';
      default: return 'light';
    }
  }

  getConsultationTypeLabel(type: string): string {
    switch (type) {
      case 'ROUTINE_CHECKUP': return 'Routine Checkup';
      case 'FOLLOW_UP': return 'Follow-up';
      case 'URGENT_CARE': return 'Urgent Care';
      case 'SPECIALIST_CONSULTATION': return 'Specialist Consultation';
      case 'MENTAL_HEALTH': return 'Mental Health';
      case 'PRESCRIPTION_REVIEW': return 'Prescription Review';
      case 'SECOND_OPINION': return 'Second Opinion';
      case 'EMERGENCY_CONSULTATION': return 'Emergency Consultation';
      default: return type;
    }
  }
}
