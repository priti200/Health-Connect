import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoConsultationService, VideoConsultation } from '../../core/services/video-consultation.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-doctor-consultation-dashboard',
  templateUrl: './doctor-consultation-dashboard.component.html',
  styleUrls: ['./doctor-consultation-dashboard.component.scss']
})
export class DoctorConsultationDashboardComponent implements OnInit, OnDestroy {
  currentUser: any;
  
  // Consultation lists
  upcomingConsultations: VideoConsultation[] = [];
  activeConsultations: VideoConsultation[] = [];
  completedConsultations: VideoConsultation[] = [];
  
  // UI state
  isLoading = false;
  error: string | null = null;
  selectedTab = 'upcoming';
  
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
    if (this.currentUser?.role !== 'DOCTOR') {
      this.router.navigate(['/telemedicine/consultations']);
      return;
    }
    
    this.loadConsultations();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
      this.loadConsultations();
    }, 30000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadConsultations(): void {
    this.isLoading = true;
    this.error = null;

    // Load all consultations
    const sub = this.videoConsultationService.getUserConsultations().subscribe({
      next: (consultations) => {
        this.categorizeConsultations(consultations);
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

  private categorizeConsultations(consultations: VideoConsultation[]): void {
    const now = new Date();
    
    this.upcomingConsultations = consultations.filter(c => 
      ['SCHEDULED', 'WAITING_FOR_PATIENT'].includes(c.status) &&
      new Date(c.scheduledStartTime) > now
    );
    
    this.activeConsultations = consultations.filter(c => 
      ['IN_PROGRESS', 'WAITING_FOR_DOCTOR'].includes(c.status)
    );
    
    this.completedConsultations = consultations.filter(c => 
      ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(c.status)
    ).slice(0, 10); // Show only last 10 completed
  }

  onStartConsultation(consultation: VideoConsultation): void {
    const sub = this.videoConsultationService.startConsultation(consultation.id).subscribe({
      next: (updatedConsultation) => {
        this.notificationService.addNotification({
          type: 'system',
          title: 'Consultation Started',
          message: 'Redirecting to consultation room...',
          priority: 'medium'
        });
        this.router.navigate(['/telemedicine/room', updatedConsultation.roomId]);
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

  onJoinConsultation(consultation: VideoConsultation): void {
    if (this.videoConsultationService.canJoinConsultation(consultation)) {
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

  canStart(consultation: VideoConsultation): boolean {
    return consultation.status === 'SCHEDULED' &&
           this.videoConsultationService.canJoinConsultation(consultation);
  }

  canJoin(consultation: VideoConsultation): boolean {
    return this.videoConsultationService.canJoinConsultation(consultation) &&
           ['IN_PROGRESS', 'WAITING_FOR_DOCTOR'].includes(consultation.status);
  }

  getStatusColor(status: string): string {
    return this.videoConsultationService.getConsultationStatusColor(status);
  }

  getTypeLabel(type: string): string {
    return this.videoConsultationService.getConsultationTypeLabel(type);
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString();
  }

  formatTime(dateTime: string): string {
    return new Date(dateTime).toLocaleTimeString();
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

  onRefresh(): void {
    this.loadConsultations();
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
  }

  getTabCount(tab: string): number {
    switch (tab) {
      case 'upcoming': return this.upcomingConsultations.length;
      case 'active': return this.activeConsultations.length;
      case 'completed': return this.completedConsultations.length;
      default: return 0;
    }
  }
}
