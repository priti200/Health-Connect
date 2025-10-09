import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Appointment,
  AppointmentRequest,
  AppointmentUpdateRequest,
  TimeSlot,
  Doctor,
  AppointmentStatus,
  AppointmentType
} from '../models/appointment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Doctor discovery
  getDoctors(specialization?: string): Observable<Doctor[]> {
    let params = new HttpParams();
    if (specialization) {
      params = params.set('specialization', specialization);
    }
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors`, { params });
  }

  getDoctor(id: number): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/doctors/${id}`);
  }

  getSpecializations(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/doctors/specializations`);
  }

  // Time slots
  getAvailableTimeSlots(doctorId: number, date: string): Observable<TimeSlot[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/doctors/${doctorId}/time-slots`, { params });
  }

  // Appointments CRUD
  getAppointments(
    status?: AppointmentStatus,
    type?: AppointmentType,
    startDate?: string,
    endDate?: string
  ): Observable<Appointment[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (type) params = params.set('type', type);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments`, { params });
  }

  getAppointment(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/appointments/${id}`);
  }

  createAppointment(request: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/appointments`, request);
  }

  updateAppointment(id: number, request: AppointmentUpdateRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/appointments/${id}`, request);
  }

  cancelAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/appointments/${id}`);
  }

  getTodayAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments/today`);
  }

  getPatientAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments`);
  }

  // Chat-related methods
  createAppointmentChat(appointmentId: number, participantId: number, chatType: string = 'PRE_APPOINTMENT', subject?: string): Observable<any> {
    const request = {
      participantId,
      chatType,
      subject
    };
    return this.http.post<any>(`${this.apiUrl}/chats/appointment/${appointmentId}`, request);
  }

  // Helper methods
  getStatusDisplayName(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING: return 'Pending';
      case AppointmentStatus.SCHEDULED: return 'Scheduled';
      case AppointmentStatus.CONFIRMED: return 'Confirmed';
      case AppointmentStatus.COMPLETED: return 'Completed';
      case AppointmentStatus.CANCELLED: return 'Cancelled';
      case AppointmentStatus.NO_SHOW: return 'No Show';
      default: return status;
    }
  }

  getTypeDisplayName(type: AppointmentType): string {
    switch (type) {
      case AppointmentType.IN_PERSON: return 'In Person';
      case AppointmentType.VIDEO_CALL: return 'Video Call';
      default: return type;
    }
  }

  getStatusBadgeClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING: return 'badge-warning';
      case AppointmentStatus.SCHEDULED: return 'badge-info';
      case AppointmentStatus.CONFIRMED: return 'badge-primary';
      case AppointmentStatus.COMPLETED: return 'badge-success';
      case AppointmentStatus.CANCELLED: return 'badge-danger';
      case AppointmentStatus.NO_SHOW: return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }
}
