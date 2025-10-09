import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoConsultationService, VideoConsultation } from '../../core/services/video-consultation.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ChatService } from '../../core/services/chat.service';
import { PresenceService } from '../../core/services/presence.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AgoraVideoService, AgoraCallState } from '../services/agora-video.service';

@Component({
  selector: 'app-consultation-room',
  templateUrl: './consultation-room.component.html',
  styleUrls: ['./consultation-room.component.scss']
})
export class ConsultationRoomComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo', { static: false }) localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: false }) remoteVideo!: ElementRef<HTMLVideoElement>;

  consultation: VideoConsultation | null = null;
  roomId: string = '';
  currentUser: any;
  
  // Video call state
  isVideoEnabled = true;
  isAudioEnabled = true;
  isScreenSharing = false;
  isCallActive = false;
  isConnecting = false;
  
  // UI state
  isChatOpen = false;
  isControlsVisible = true;
  showParticipants = false;
  
  // Chat
  messages: any[] = [];
  newMessage = '';
  
  // Error handling
  error: string | null = null;
  connectionStatus = 'Connecting...';



  // Call duration tracking
  callDuration = 0;
  private callStartTime: Date | null = null;
  private durationInterval: any;

  // Recording functionality
  isRecording = false;
  private recordingStartTime: Date | null = null;

  private subscriptions: Subscription[] = [];
  private controlsTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoConsultationService: VideoConsultationService,
    private http: HttpClient,
    private chatService: ChatService,
    private presenceService: PresenceService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private agoraVideoService: AgoraVideoService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.roomId = params['roomId'];
      console.log('[DEBUG] ngOnInit roomId param:', this.roomId);
      if (this.roomId) {
        this.initializeConsultation();
      }
    });

    // Auto-hide controls after 5 seconds of inactivity
    this.resetControlsTimeout();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.leaveAgoraCall();
    this.stopCallDurationTracking();
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
  }

  public async initializeConsultation(): Promise<void> {
    try {
      this.isConnecting = true;
      this.connectionStatus = 'Loading consultation...';
      console.log('[DEBUG] initializeConsultation using roomId:', this.roomId);
      // Get consultation details
      const sub = this.videoConsultationService.getConsultationByRoomId(this.roomId).subscribe({
        next: (consultation) => {
          this.consultation = consultation;
          this.continueInitialization();
        },
        error: (error) => {
          console.error('Failed to get consultation:', error);
          this.error = 'Failed to load consultation details';
          this.isConnecting = false;
        }
      });
      this.subscriptions.push(sub);
    } catch (error) {
      console.error('Failed to initialize consultation:', error);
      this.error = 'Failed to join the consultation. Please try again.';
      this.isConnecting = false;
    }
  }

  private async continueInitialization(): Promise<void> {
    try {
      // Check if user is authorized
      if (!this.isAuthorizedUser()) {
        this.error = 'You are not authorized to join this consultation';
        return;
      }

      // Initialize Agora Video
      this.connectionStatus = 'Connecting to video call...';
      await this.initializeAgoraVideo();

      this.isConnecting = false;
      this.isCallActive = true;
      this.connectionStatus = 'Connected';

      // Start call duration tracking
      this.startCallDurationTracking();
    } catch (error) {
      console.error('Failed to continue initialization:', error);
      this.error = 'Failed to initialize video consultation';
      this.isConnecting = false;
    }
  }

  private async initializeAgoraVideo(): Promise<void> {
    try {
      console.log('Starting Agora Video initialization...');

      // Set user as busy during video call
      this.presenceService.updatePresence('BUSY', 'In video consultation');

      this.connectionStatus = 'Joining video channel...';

      // Use the AgoraVideoService to join the room
      await this.agoraVideoService.joinRoom(this.roomId, this.currentUser.id.toString());

      // Subscribe to video tracks for UI updates
      this.subscriptions.push(
        this.agoraVideoService.localVideoTrack$.subscribe(track => {
          if (track && this.localVideo) {
            track.play(this.localVideo.nativeElement);
          }
        })
      );

      this.subscriptions.push(
        this.agoraVideoService.remoteVideoTracks$.subscribe(tracks => {
          // Play the first remote video track
          const firstTrack = tracks.values().next().value;
          if (firstTrack && this.remoteVideo) {
            firstTrack.play(this.remoteVideo.nativeElement);
          }
        })
      );

      // Subscribe to call state changes
      this.subscriptions.push(
        this.agoraVideoService.callState$.subscribe(state => {
          this.isCallActive = state.isConnected;
          this.isConnecting = state.isConnecting;
          this.isVideoEnabled = state.localVideoEnabled;
          this.isAudioEnabled = state.localAudioEnabled;

          if (state.error) {
            this.error = state.error;
            this.connectionStatus = 'Connection error';
          } else if (state.isConnected) {
            this.connectionStatus = '✅ Connected and ready for video call!';
            this.startCallDurationTracking();
          } else if (state.isConnecting) {
            this.connectionStatus = 'Connecting...';
          }
        })
      );

      console.log('Agora Video initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Agora video:', error);
      this.connectionStatus = 'Failed to connect to video call';
      this.presenceService.updatePresence('ONLINE');
      this.error = 'Failed to initialize video call. Please check your camera and microphone permissions.';
      throw new Error('Failed to initialize video call');
    }
  }





  private async leaveAgoraCall(): Promise<void> {
    try {
      await this.agoraVideoService.leaveRoom();
      console.log('Left Agora call successfully');
    } catch (error) {
      console.error('Error leaving Agora call:', error);
    }
  }

  // Event listeners are now handled in setupAgoraEventHandlers method

  private isAuthorizedUser(): boolean {
    if (!this.consultation) return false;
    
    return this.consultation.doctor.id === this.currentUser.id || 
           this.consultation.patient.id === this.currentUser.id;
  }

  private handleConnectionError(): void {
    this.error = 'Connection lost. Attempting to reconnect...';
    // Implement reconnection logic here
  }

  // Video controls
  async toggleVideo(): Promise<void> {
    try {
      await this.agoraVideoService.toggleVideo();
      this.resetControlsTimeout();
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  }

  async toggleAudio(): Promise<void> {
    try {
      await this.agoraVideoService.toggleAudio();
      this.resetControlsTimeout();
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  }

  async toggleScreenShare(): Promise<void> {
    try {
      // Note: Screen sharing with Agora Video requires additional implementation
      // For now, we'll show a placeholder message
      this.notificationService.addNotification({
        type: 'system',
        title: 'Screen Share',
        message: 'Screen sharing feature will be available in the next update',
        priority: 'medium'
      });
      this.resetControlsTimeout();
    } catch (error) {
      console.error('Screen share toggle failed:', error);
      this.notificationService.addNotification({
        type: 'system',
        title: 'Screen Share Error',
        message: 'Failed to toggle screen sharing',
        priority: 'medium'
      });
    }
  }

  // UI controls
  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.loadChatMessages();
    }
  }

  toggleParticipants(): void {
    this.showParticipants = !this.showParticipants;
  }

  onMouseMove(): void {
    this.isControlsVisible = true;
    this.resetControlsTimeout();
  }

  private resetControlsTimeout(): void {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    this.controlsTimeout = setTimeout(() => {
      this.isControlsVisible = false;
    }, 5000);
  }

  // Chat functionality
  private loadChatMessages(): void {
    if (!this.consultation?.appointment?.id) return;

    // For now, initialize empty messages array
    // In a full implementation, this would load appointment-specific chat
    this.messages = [];

    // Subscribe to new messages
    const sub = this.chatService.messages$.subscribe({
      next: (message: any) => {
        this.messages.push(message);
      },
      error: (error: any) => {
        console.error('Failed to load chat messages:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    // For video consultation chat, we'll use a simple approach
    // In a full implementation, this would integrate with the chat system
    const message = {
      id: Date.now(),
      content: this.newMessage.trim(),
      sender: this.currentUser,
      timestamp: new Date().toISOString(),
      status: 'SENT'
    };

    this.messages.push(message);
    this.newMessage = '';

    // In a real implementation, this would send via WebSocket or HTTP
    console.log('Video consultation message sent:', message);
  }

  // End consultation
  async endConsultation(): Promise<void> {
    if (this.currentUser.role !== 'DOCTOR') {
      this.leaveConsultation();
      return;
    }

    const confirmed = confirm('Are you sure you want to end this consultation?');
    if (!confirmed) return;

    try {
      // End Agora session
      this.isCallActive = false;
      await this.leaveAgoraCall();
      this.stopCallDurationTracking();

      // Reset presence to online
      this.presenceService.updatePresence('ONLINE');

      if (this.consultation?.id) {
        const sub = this.videoConsultationService.endConsultation(
          this.consultation.id,
          '', // notes - could be collected via modal
          '', // diagnosis
          ''  // recommendations
        ).subscribe({
          next: () => {
            this.notificationService.addNotification({
              type: 'system',
              title: 'Consultation Ended',
              message: 'The consultation has been ended successfully.',
              priority: 'medium'
            });
            this.router.navigate(['/telemedicine/consultations']);
          },
          error: (error) => {
            console.error('Failed to end consultation:', error);
            this.notificationService.addNotification({
              type: 'system',
              title: 'Error',
              message: 'Failed to end the consultation.',
              priority: 'high'
            });
          }
        });
        this.subscriptions.push(sub);
      }
    } catch (error) {
      console.error('Failed to end consultation:', error);
    }
  }

  leaveConsultation(): void {
    const confirmed = confirm('Are you sure you want to leave this consultation?');
    if (confirmed) {
      // End Agora session
      this.isCallActive = false;
      this.leaveAgoraCall();

      // Reset presence to online
      this.presenceService.updatePresence('ONLINE');

      this.router.navigate(['/telemedicine/consultations']);
    }
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  // Call duration tracking
  private startCallDurationTracking(): void {
    this.callStartTime = new Date();
    this.callDuration = 0;

    this.durationInterval = setInterval(() => {
      if (this.callStartTime) {
        this.callDuration = Math.floor((new Date().getTime() - this.callStartTime.getTime()) / 1000);
      }
    }, 1000);
  }

  private stopCallDurationTracking(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString();
  }

  getStatusColor(): string {
    if (!this.consultation) return 'secondary';

    switch (this.consultation.status) {
      case 'SCHEDULED': return 'primary';
      case 'WAITING_FOR_DOCTOR':
      case 'WAITING_FOR_PATIENT': return 'warning';
      case 'IN_PROGRESS': return 'success';
      case 'COMPLETED': return 'info';
      case 'CANCELLED':
      case 'NO_SHOW': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(): string {
    if (!this.consultation) return 'Unknown';

    switch (this.consultation.status) {
      case 'SCHEDULED': return 'Scheduled';
      case 'WAITING_FOR_DOCTOR': return 'Waiting for Doctor';
      case 'WAITING_FOR_PATIENT': return 'Waiting for Patient';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'NO_SHOW': return 'No Show';
      default: return this.consultation.status;
    }
  }

  // Recording functionality
  formatRecordingDuration(): string {
    if (!this.recordingStartTime) return '00:00';

    const now = new Date();
    const duration = Math.floor((now.getTime() - this.recordingStartTime.getTime()) / 1000);
    return this.formatDuration(duration);
  }

  toggleRecording(): void {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording(): void {
    this.isRecording = true;
    this.recordingStartTime = new Date();
    // In a real implementation, this would start actual recording
    console.log('Recording started');
  }

  private stopRecording(): void {
    this.isRecording = false;
    this.recordingStartTime = null;
    // In a real implementation, this would stop recording and save the file
    console.log('Recording stopped');
  }
}
