import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoConsultationService, VideoConsultation } from '../../core/services/video-consultation.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-consultation-list',
  templateUrl: './consultation-list.component.html',
  styleUrls: ['./consultation-list.component.scss']
})
export class ConsultationListComponent implements OnInit, OnDestroy {
  consultations: VideoConsultation[] = [];
  upcomingConsultations: VideoConsultation[] = [];
  isLoading = false;
  error: string | null = null;
  currentUser: any;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private videoConsultationService: VideoConsultationService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadConsultations();
    this.loadUpcomingConsultations();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  public loadConsultations(): void {
    this.isLoading = true;
    this.error = null;

    const sub = this.videoConsultationService.getUserConsultations().subscribe({
      next: (consultations) => {
        this.consultations = consultations;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load consultations:', error);
        this.error = 'Failed to load consultations';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private loadUpcomingConsultations(): void {
    const sub = this.videoConsultationService.getUpcomingConsultations().subscribe({
      next: (consultations) => {
        this.upcomingConsultations = consultations;
      },
      error: (error) => {
        console.error('Failed to load upcoming consultations:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  onJoinConsultation(consultation: VideoConsultation): void {
    if (this.videoConsultationService.canJoinConsultation(consultation)) {
      // Navigate using roomId instead of consultation.id
      this.router.navigate(['/telemedicine/room', consultation.roomId]);
    } else {
      this.notificationService.addNotification({
        type: 'system',
        title: 'Cannot Join Consultation',
        message: 'The consultation is not available for joining at this time.',
        priority: 'medium'
      });
    }
  }

  onViewConsultation(consultation: VideoConsultation): void {
    this.router.navigate(['/telemedicine/consultation', consultation.id]);
  }

  onStartConsultation(consultation: VideoConsultation): void {
    if (this.currentUser?.role === 'DOCTOR') {
      const sub = this.videoConsultationService.startConsultation(consultation.id).subscribe({
        next: (updatedConsultation) => {
          this.notificationService.addNotification({
            type: 'system',
            title: 'Consultation Started',
            message: 'The consultation has been started successfully.',
            priority: 'medium'
          });
          this.router.navigate(['/telemedicine/room', updatedConsultation.id]);
        },
        error: (error) => {
          console.error('Failed to start consultation:', error);
          this.notificationService.addNotification({
            type: 'system',
            title: 'Error',
            message: 'Failed to start the consultation. Please try again.',
            priority: 'high'
          });
        }
      });
      this.subscriptions.push(sub);
    }
  }

  getStatusColor(status: string): string {
    return this.videoConsultationService.getConsultationStatusColor(status);
  }

  getTypeLabel(type: string): string {
    return this.videoConsultationService.getConsultationTypeLabel(type);
  }

  canJoin(consultation: VideoConsultation): boolean {
    return this.videoConsultationService.canJoinConsultation(consultation);
  }

  canStart(consultation: VideoConsultation): boolean {
    return this.currentUser?.role === 'DOCTOR' && 
           consultation.status === 'SCHEDULED' &&
           this.videoConsultationService.canJoinConsultation(consultation);
  }

  isActive(consultation: VideoConsultation): boolean {
    return this.videoConsultationService.isConsultationActive(consultation);
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString();
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  getParticipantName(consultation: VideoConsultation): string {
    if (!consultation) {
      return 'Unknown';
    }

    if (this.currentUser?.role === 'DOCTOR') {
      // Doctor viewing patient name
      if (consultation.patient) {
        return consultation.patient.fullName ||
               `${consultation.patient.firstName || ''} ${consultation.patient.lastName || ''}`.trim() ||
               'Patient';
      }
      return 'Patient';
    } else {
      // Patient viewing doctor name
      if (consultation.doctor) {
        const doctorName = consultation.doctor.fullName ||
                          `${consultation.doctor.firstName || ''} ${consultation.doctor.lastName || ''}`.trim() ||
                          'Doctor';
        return doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`;
      }
      return 'Doctor';
    }
  }

  getParticipantRole(consultation: VideoConsultation): string {
    if (this.currentUser?.role === 'DOCTOR') {
      return 'Patient';
    } else {
      return 'Doctor';
    }
  }

  onRefresh(): void {
    this.loadConsultations();
    this.loadUpcomingConsultations();
  }

  onCreateConsultation(): void {
    // Navigate to appointment booking or consultation creation
    this.router.navigate(['/appointments/book']);
  }

  getTimeUntilConsultation(consultation: VideoConsultation): string {
    const now = new Date();
    const scheduledTime = new Date(consultation.scheduledStartTime);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return 'Now';
    }
    
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }

  isConsultationSoon(consultation: VideoConsultation): boolean {
    const now = new Date();
    const scheduledTime = new Date(consultation.scheduledStartTime);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    return minutesDiff <= 15 && minutesDiff > 0;
  }

  getOtherPartyName(consultation: VideoConsultation): string {
    return this.getParticipantName(consultation);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'SCHEDULED': return 'Scheduled';
      case 'WAITING_FOR_DOCTOR': return 'Waiting for Doctor';
      case 'WAITING_FOR_PATIENT': return 'Waiting for Patient';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'NO_SHOW': return 'No Show';
      default: return status;
    }
  }

  formatDate(dateTime: string): string {
    return new Date(dateTime).toLocaleDateString();
  }

  formatTime(dateTime: string): string {
    return new Date(dateTime).toLocaleTimeString();
  }
}
