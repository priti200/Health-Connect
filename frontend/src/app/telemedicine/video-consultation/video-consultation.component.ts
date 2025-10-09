import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoConsultationService, VideoConsultation } from '../../core/services/video-consultation.service';
import { WebRTCVideoService } from '../services/webrtc-video.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-video-consultation',
  templateUrl: './video-consultation.component.html',
  styleUrls: ['./video-consultation.component.scss']
})
export class VideoConsultationComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo', { static: false }) localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: false }) remoteVideoRef!: ElementRef<HTMLVideoElement>;

  consultation: VideoConsultation | null = null;
  isLoading = false;
  error: string | null = null;
  currentUser: any;
  consultationId: number | null = null;
  appointmentId: number | null = null;

  // Video calling properties
  isVideoCallActive = false;
  isVideoEnabled = true;
  isAudioEnabled = true;
  connectionStatus = 'disconnected';
  callStartTime: Date | null = null;
  callTimer: any;
  roomId: string = '';
  userRole: 'host' | 'participant' = 'participant';
  isWaitingForParticipants = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoConsultationService: VideoConsultationService,
    private webrtcService: WebRTCVideoService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const appointmentId = +params['id'];
      if (appointmentId) {
        // Store the appointment ID
        this.appointmentId = appointmentId;
        // The ID from the route is an appointment ID
        this.roomId = `consultation-${appointmentId}`;
        this.loadConsultationByAppointmentId(appointmentId);
        this.setupWebRTCSubscriptions();
      }
    });

    // Check if user is host or participant
    this.route.queryParams.subscribe(queryParams => {
      this.userRole = queryParams['role'] || 'participant';
      console.log('🎭 User role in video call:', this.userRole);

      if (this.userRole === 'host') {
        // Doctor starts the call immediately
        this.startVideoCallAsHost();
      } else {
        // Patient waits for doctor or joins existing call
        this.joinVideoCallAsParticipant();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.webrtcService.leaveRoom();
    this.cleanupVideoCall();
  }

  private setupWebRTCSubscriptions(): void {
    // Subscribe to connection status
    this.subscriptions.push(
      this.webrtcService.connectionStatus$.subscribe(status => {
        this.connectionStatus = status;
        console.log('Connection status:', status);
      })
    );

    // Subscribe to local stream
    this.subscriptions.push(
      this.webrtcService.localStream$.subscribe(stream => {
        if (stream && this.localVideoRef) {
          this.localVideoRef.nativeElement.srcObject = stream;
          this.localVideoRef.nativeElement.play().catch(e => console.log('Local video play error:', e));
        }
      })
    );

    // Subscribe to remote stream
    this.subscriptions.push(
      this.webrtcService.remoteStream$.subscribe(stream => {
        if (stream && this.remoteVideoRef) {
          this.remoteVideoRef.nativeElement.srcObject = stream;
          this.remoteVideoRef.nativeElement.play().catch(e => console.log('Remote video play error:', e));

          // When remote stream is available, stop waiting
          if (this.isWaitingForParticipants) {
            this.isWaitingForParticipants = false;
            this.notificationService.addNotification({
              type: 'system',
              title: 'Patient Joined',
              message: 'The patient has joined the video call!',
              priority: 'medium'
            });
          }
        }
      })
    );

    // Subscribe to video/audio state
    this.subscriptions.push(
      this.webrtcService.isVideoEnabled$.subscribe(enabled => {
        this.isVideoEnabled = enabled;
      })
    );

    this.subscriptions.push(
      this.webrtcService.isAudioEnabled$.subscribe(enabled => {
        this.isAudioEnabled = enabled;
      })
    );
  }

  public loadConsultationByAppointmentId(appointmentId: number): void {
    this.isLoading = true;
    this.error = null;

    // Try to get existing consultation by appointment ID
    const sub = this.videoConsultationService.getConsultationByAppointmentId(appointmentId).subscribe({
      next: (consultation) => {
        if (consultation) {
          this.consultation = consultation;
          this.consultationId = consultation.id;
        } else {
          // No consultation exists, we'll start the video call directly
          console.log('No existing consultation found, starting video call directly for appointment:', appointmentId);
          this.startDirectVideoCall();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load consultation:', error);
        // If there's an error loading, try to start video call directly
        console.log('Error loading consultation, starting video call directly for appointment:', appointmentId);
        this.startDirectVideoCall();
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private startDirectVideoCall(): void {
    // No longer used. This method is now obsolete and can be removed.
  }

  private async startVideoCallAsHost(): Promise<void> {
    if (!this.appointmentId) {
      this.notificationService.addNotification({
        type: 'system',
        title: 'Error',
        message: 'No appointment ID found.',
        priority: 'high'
      });
      return;
    }
    this.isWaitingForParticipants = true;
    this.isLoading = true;
    try {
      // Always create or fetch the consultation before navigating
      this.videoConsultationService.createConsultation(this.appointmentId, 'ROUTINE_CHECKUP').subscribe({
        next: (consultation) => {
          this.consultation = consultation;
          this.consultationId = consultation.id;
          this.roomId = consultation.id.toString();
          this.isLoading = false;
          // Navigate to consultation room with the correct consultation ID (integer)
          this.router.navigate(['/telemedicine/room', this.consultationId], {
            queryParams: {
              appointmentId: this.appointmentId,
              role: 'doctor'
            }
          });
          this.notificationService.addNotification({
            type: 'system',
            title: 'Video Call Started',
            message: 'Redirecting to video consultation room...',
            priority: 'medium'
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.addNotification({
            type: 'system',
            title: 'Video Call Error',
            message: 'Failed to create or fetch consultation. Please try again.',
            priority: 'high'
          });
        }
      });
    } catch (error) {
      this.isLoading = false;
      this.notificationService.addNotification({
        type: 'system',
        title: 'Video Call Error',
        message: 'Failed to start video call. Please try again.',
        priority: 'high'
      });
    }
  }

  private async joinVideoCallAsParticipant(): Promise<void> {
    if (!this.appointmentId) {
      this.notificationService.addNotification({
        type: 'system',
        title: 'Error',
        message: 'No appointment ID found.',
        priority: 'high'
      });
      return;
    }
    this.isLoading = true;
    try {
      // Always create or fetch the consultation before navigating
      this.videoConsultationService.createConsultation(this.appointmentId, 'ROUTINE_CHECKUP').subscribe({
        next: (consultation) => {
          this.consultation = consultation;
          this.consultationId = consultation.id;
          this.roomId = consultation.id.toString();
          this.isLoading = false;
          // Navigate to consultation room with the correct consultation ID (integer)
          this.router.navigate(['/telemedicine/room', this.consultationId], {
            queryParams: {
              appointmentId: this.appointmentId,
              role: 'patient'
            }
          });
          this.notificationService.addNotification({
            type: 'system',
            title: 'Joined Video Call',
            message: 'Redirecting to video consultation room...',
            priority: 'medium'
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.addNotification({
            type: 'system',
            title: 'Video Call Error',
            message: 'Failed to create or fetch consultation. Please try again.',
            priority: 'high'
          });
        }
      });
    } catch (error) {
      this.isLoading = false;
      this.notificationService.addNotification({
        type: 'system',
        title: 'Video Call Error',
        message: 'Failed to join video call. Please try again.',
        priority: 'high'
      });
    }
  }

  public loadConsultation(): void {
    if (!this.consultationId) return;

    this.isLoading = true;
    this.error = null;

    const sub = this.videoConsultationService.getConsultation(this.consultationId).subscribe({
      next: (consultation) => {
        this.consultation = consultation;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load consultation:', error);
        this.error = 'Failed to load consultation details';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  async onJoinConsultation(): Promise<void> {
    if (!this.consultation || !this.roomId) return;

    try {
      this.isVideoCallActive = true;
      this.callStartTime = new Date();
      this.startCallTimer();

      console.log('Joining WebRTC video call room:', this.roomId);

      await this.webrtcService.joinRoom(this.roomId);

      this.notificationService.addNotification({
        type: 'system',
        title: 'Video Call Started',
        message: 'Successfully joined the video consultation!',
        priority: 'medium'
      });

    } catch (error) {
      console.error('Failed to join video call:', error);
      this.notificationService.addNotification({
        type: 'system',
        title: 'Video Call Error',
        message: 'Failed to join video call. Please check your camera and microphone permissions.',
        priority: 'high'
      });
      this.isVideoCallActive = false;
    }
  }

  onStartConsultation(): void {
    if (!this.consultation || !this.consultationId) return;

    if (this.currentUser?.role === 'DOCTOR') {
      const sub = this.videoConsultationService.startConsultation(this.consultationId).subscribe({
        next: (updatedConsultation) => {
          this.consultation = updatedConsultation;
          this.notificationService.addNotification({
            type: 'system',
            title: 'Consultation Started',
            message: 'The consultation has been started successfully.',
            priority: 'medium'
          });
          // Start the video call directly instead of navigating away
          this.onJoinConsultation();
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

  onEndConsultation(): void {
    if (!this.consultation || !this.consultationId) return;

    if (this.currentUser?.role === 'DOCTOR') {
      const notes = prompt('Enter consultation notes (optional):') || '';
      const diagnosis = prompt('Enter diagnosis (optional):') || '';
      const recommendations = prompt('Enter recommendations (optional):') || '';

      const sub = this.videoConsultationService.endConsultation(
        this.consultationId, 
        notes, 
        diagnosis, 
        recommendations
      ).subscribe({
        next: (updatedConsultation) => {
          this.consultation = updatedConsultation;
          this.notificationService.addNotification({
            type: 'system',
            title: 'Consultation Ended',
            message: 'The consultation has been ended successfully.',
            priority: 'medium'
          });
        },
        error: (error) => {
          console.error('Failed to end consultation:', error);
          this.notificationService.addNotification({
            type: 'system',
            title: 'Error',
            message: 'Failed to end the consultation. Please try again.',
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

  canJoin(): boolean {
    return this.consultation ? this.videoConsultationService.canJoinConsultation(this.consultation) : false;
  }

  canStart(): boolean {
    return this.currentUser?.role === 'DOCTOR' && 
           this.consultation?.status === 'SCHEDULED' &&
           this.canJoin();
  }

  canEnd(): boolean {
    return this.currentUser?.role === 'DOCTOR' && 
           this.consultation?.status === 'IN_PROGRESS';
  }

  isActive(): boolean {
    return this.consultation ? this.videoConsultationService.isConsultationActive(this.consultation) : false;
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString();
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  // Video calling methods - now handled by WebRTCVideoService

  toggleVideo(): void {
    this.webrtcService.toggleVideo();
  }

  toggleAudio(): void {
    this.webrtcService.toggleAudio();
  }

  endVideoCall(): void {
    this.webrtcService.leaveRoom();
    this.cleanupVideoCall();
    this.isVideoCallActive = false;
    this.notificationService.addNotification({
      type: 'system',
      title: 'Video Call Ended',
      message: 'The video call has been ended.',
      priority: 'medium'
    });
  }

  private startCallTimer(): void {
    this.callTimer = setInterval(() => {
      if (this.callStartTime) {
        const elapsed = new Date().getTime() - this.callStartTime.getTime();
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const timerElement = document.getElementById('callTimer');
        if (timerElement) {
          timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      }
    }, 1000);
  }

  private cleanupVideoCall(): void {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
    this.callStartTime = null;
  }
}
